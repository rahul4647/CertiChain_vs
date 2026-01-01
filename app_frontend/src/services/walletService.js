import { supabase } from '@/supabaseClient';
import { Wallet } from 'ethers';

// ⚠️ MVP ONLY — replace with real encryption later
function encrypt(text) {
  return btoa(text);
}

function decrypt(text) {
  return atob(text);
}

export const walletService = {

  /* ======================================================
     STUDENT / REGULAR USER WALLET (RECEIVING ONLY)
     ====================================================== */

  // Check if user already has a wallet
  async getUserWallet(userId) {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      return null;
    }
  },

  // Generate wallet for student / regular user
  async generateWallet(userId, { name, email, department }) {
    try {
      // 🔒 Prevent duplicate wallet creation
      const existing = await this.getUserWallet(userId);
      if (existing) {
        return {
          success: true,
          wallet: existing,
          address: existing.wallet_address
        };
      }

      const wallet = Wallet.createRandom();

      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          name,
          email,
          department,
          wallet_address: wallet.address,
          wallet_provider: 'generated'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        wallet: data,
        address: wallet.address
      };
    } catch (error) {
      console.error('Error generating user wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Connect external wallet (MetaMask etc.)
  async connectExternalWallet(userId, walletAddress) {
    try {
      // 🔒 Preserve identity fields
      const existing = await this.getUserWallet(userId);

      const { data, error } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: userId,
          wallet_address: walletAddress,
          wallet_provider: 'external',
          name: existing?.name,
          email: existing?.email,
          department: existing?.department
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        wallet: data
      };
    } catch (error) {
      console.error('Error connecting external wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /* ======================================================
     INSTRUCTOR WALLET (SIGNING ONLY)
     ====================================================== */

  // Create instructor + signing wallet
async registerInstructor({ userId }) {
  try {
    console.log("▶ registerInstructor START", userId);

    // 1️⃣ Fetch user wallet (identity source)
    const userWallet = await this.getUserWallet(userId);
    console.log("▶ userWallet:", userWallet);

    if (!userWallet) {
      throw new Error("User wallet must exist before becoming instructor");
    }

    // 2️⃣ Check if instructor already exists
    const { data: existing, error: fetchErr } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      console.log("▶ Instructor already exists");
      return { success: true };
    }

    // 3️⃣ Resolve REQUIRED identity fields (cannot be null)
    const { data: authData } = await supabase.auth.getUser();

    const instructorName =
      userWallet.name ||
      authData?.user?.user_metadata?.full_name ||
      authData?.user?.email?.split("@")[0];

    const instructorEmail =
      userWallet.email ||
      authData?.user?.email;

    if (!instructorName || !instructorEmail) {
      throw new Error("Instructor identity missing (name/email)");
    }

    // 4️⃣ Generate signing wallet (authority wallet)
    const wallet = Wallet.createRandom();
    console.log("▶ Generated signing wallet:", wallet.address);

    // 5️⃣ Insert instructor (MATCHES SCHEMA EXACTLY)
    const { error: insertErr } = await supabase
      .from("instructors")
      .insert({
        user_id: userId,
        name: instructorName,                 // ✅ NOT NULL
        email: instructorEmail,               // ✅ NOT NULL
        department: userWallet.department,
        wallet_address: wallet.address,       // ✅ NOT NULL
        private_key_encrypted: encrypt(wallet.privateKey),
        status: "active"
      });

    if (insertErr) throw insertErr;

    console.log("✅ Instructor created successfully");

    return {
      success: true,
      signingWallet: wallet.address
    };

  } catch (error) {
    console.error("❌ registerInstructor FAILED:", error);
    return {
      success: false,
      error: error.message
    };
  }
},



  // Get instructor signing wallet
  async getInstructorWallet(userId) {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('private_key_encrypted')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        privateKey: decrypt(data.private_key_encrypted)
      };
    } catch (error) {
      console.error('Error fetching instructor wallet:', error);
      return null;
    }
  }

};
