import { supabase } from '@/supabaseClient';
import { ethers } from 'ethers';

// Encryption key - store in env variable in production!
const ENCRYPTION_KEY = process.env.REACT_APP_WALLET_ENCRYPTION_KEY || 'your-secret-key-change-in-production';

// Simple encryption (use proper encryption in production!)
function encrypt(text) {
  // In production, use crypto-js or similar
  return btoa(text); // Basic base64 for demo
}

function decrypt(encrypted) {
  return atob(encrypted);
}

export const walletService = {
  // Check if user has a wallet
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
      console.error('Error fetching wallet:', error);
      return null;
    }
  },

  // Generate new wallet
  async generateWallet(userId, userEmail) {
    try {
      // Generate new Ethereum wallet
      const wallet = ethers.Wallet.createRandom();
      
      console.log('Generated wallet:', wallet.address);

      // Encrypt private key
      const encryptedPrivateKey = encrypt(wallet.privateKey);

      // Store in database
      const { data, error } = await supabase
        .from('user_wallets')
        .insert([
          {
            user_id: userId,
            wallet_address: wallet.address,
            wallet_provider: 'generated',
            private_key_encrypted: encryptedPrivateKey,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Also update instructors table if they're an instructor
      await this.syncInstructorWallet(userId, wallet.address, encryptedPrivateKey);

      return {
        success: true,
        wallet: data,
        address: wallet.address
      };
    } catch (error) {
      console.error('Error generating wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sync wallet to instructors table
  async syncInstructorWallet(userId, walletAddress, encryptedPrivateKey) {
    try {
      // Check if user is an instructor
      const { data: instructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (instructor) {
        // Update instructor wallet
        await supabase
          .from('instructors')
          .update({
            wallet_address: walletAddress,
            private_key_encrypted: encryptedPrivateKey
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error syncing instructor wallet:', error);
    }
  },

  // Connect existing wallet (MetaMask, etc.)
  async connectExternalWallet(userId, walletAddress) {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .upsert([
          {
            user_id: userId,
            wallet_address: walletAddress,
            wallet_provider: 'external',
            private_key_encrypted: null // External wallets don't store private keys
          }
        ], {
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
      console.error('Error connecting wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};