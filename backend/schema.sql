-- CertiChain Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. EXTEND AUTH.USERS WITH WALLET INFORMATION
-- =====================================================
-- Note: auth.users is managed by Supabase Auth
-- We'll create a separate profiles table to store additional user data

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT,
    private_key_encrypted TEXT, -- Store encrypted private key
    department TEXT,
    total_certificates_issued INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 2. GROUPS TABLE (Certificate Groups/Courses)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    max_learners INTEGER DEFAULT 100,
    learner_count INTEGER DEFAULT 0,
    join_code TEXT UNIQUE NOT NULL,
    template_id UUID, -- References certificate_templates
    collection_id TEXT, -- Crossmint Collection ID
    contract_address TEXT, -- Blockchain contract address
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active groups
CREATE POLICY "Anyone can view active groups" ON public.groups
    FOR SELECT USING (status = 'active');

-- Policy: Users can create groups
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Creators can update their groups
CREATE POLICY "Creators can update own groups" ON public.groups
    FOR UPDATE USING (auth.uid() = created_by);

-- Index for faster join code lookups
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);

-- =====================================================
-- 3. CERTIFICATE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    ipfs_cid TEXT, -- IPFS CID for template
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.certificate_templates
    FOR SELECT USING (true);

CREATE POLICY "Creators can insert templates" ON public.certificate_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_templates_group_id ON public.certificate_templates(group_id);

-- =====================================================
-- 4. TEMPLATE FIELDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.template_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
    label TEXT, -- Field label (for text fields)
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'qr')),
    qr_image TEXT, -- Base64 QR code image for QR fields
    x INTEGER NOT NULL, -- X position on PDF
    y INTEGER NOT NULL, -- Y position on PDF
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view template fields" ON public.template_fields
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert fields" ON public.template_fields
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_fields_template_id ON public.template_fields(template_id);

-- =====================================================
-- 5. CERTIFICATES TABLE (Issued Certificates)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT UNIQUE NOT NULL, -- Human-readable ID (CERT-timestamp-random)
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
    
    -- Recipient Information
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    student_id TEXT,
    recipient_wallet TEXT, -- Wallet address of recipient
    
    -- Issuer Information
    issuer_name TEXT NOT NULL,
    issuer_wallet TEXT NOT NULL,
    issuer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Certificate Data
    canonical_payload JSONB NOT NULL, -- Sorted JSON payload
    certificate_hash TEXT NOT NULL, -- SHA256 hash
    issuer_signature TEXT NOT NULL, -- Cryptographic signature
    
    -- NFT Information
    nft_id TEXT, -- Crossmint NFT ID
    token_id TEXT, -- Blockchain token ID
    blockchain_tx TEXT, -- Transaction hash
    chain TEXT DEFAULT 'polygon',
    
    -- IPFS Storage
    pdf_ipfs_cid TEXT, -- Certificate PDF on IPFS
    pdf_ipfs_url TEXT, -- IPFS URL
    metadata_ipfs_cid TEXT, -- Metadata on IPFS
    
    -- QR Code
    qr_code_data TEXT, -- QR code content
    verification_url TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'minting', 'minted', 'failed')),
    minting_error TEXT,
    
    -- Timestamps
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    minted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view minted certificates (for verification)
CREATE POLICY "Anyone can view minted certificates" ON public.certificates
    FOR SELECT USING (status = 'minted');

-- Policy: Users can view their own certificates
CREATE POLICY "Users can view own certificates by email" ON public.certificates
    FOR SELECT USING (recipient_email = auth.jwt()->>'email');

-- Policy: Issuers can view certificates they issued
CREATE POLICY "Issuers can view issued certificates" ON public.certificates
    FOR SELECT USING (auth.uid() = issuer_user_id);

-- Policy: System can insert certificates
CREATE POLICY "Authenticated users can create certificates" ON public.certificates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: System can update certificates
CREATE POLICY "Authenticated users can update certificates" ON public.certificates
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_group_id ON public.certificates(group_id);
CREATE INDEX IF NOT EXISTS idx_certificates_recipient_email ON public.certificates(recipient_email);
CREATE INDEX IF NOT EXISTS idx_certificates_nft_id ON public.certificates(nft_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issuer ON public.certificates(issuer_user_id);

-- =====================================================
-- 6. NFT METADATA TABLE (Blockchain Metadata Storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nft_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
    nft_id TEXT UNIQUE NOT NULL,
    
    -- NFT Metadata
    name TEXT NOT NULL,
    description TEXT,
    image TEXT, -- IPFS URL
    external_url TEXT,
    attributes JSONB, -- NFT attributes array
    
    -- Blockchain Info
    chain TEXT DEFAULT 'polygon',
    contract_address TEXT,
    token_id TEXT,
    owner_wallet TEXT,
    transaction_hash TEXT,
    
    -- Status
    onchain_status TEXT DEFAULT 'pending' CHECK (onchain_status IN ('pending', 'confirmed', 'failed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nft_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view NFT metadata" ON public.nft_metadata
    FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_nft_metadata_certificate_id ON public.nft_metadata(certificate_id);
CREATE INDEX IF NOT EXISTS idx_nft_metadata_nft_id ON public.nft_metadata(nft_id);

-- =====================================================
-- 7. COLLECTIONS TABLE (NFT Collections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id TEXT UNIQUE NOT NULL, -- Crossmint Collection ID
    name TEXT NOT NULL,
    description TEXT,
    symbol TEXT,
    chain TEXT DEFAULT 'polygon',
    contract_address TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collections" ON public.collections
    FOR SELECT USING (true);

-- =====================================================
-- 8. ADD FOREIGN KEY FOR GROUPS.TEMPLATE_ID
-- =====================================================
ALTER TABLE public.groups 
ADD CONSTRAINT fk_groups_template 
FOREIGN KEY (template_id) 
REFERENCES public.certificate_templates(id) 
ON DELETE SET NULL;

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.certificate_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_metadata_updated_at BEFORE UPDATE ON public.nft_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment certificate count when minted
CREATE OR REPLACE FUNCTION increment_issuer_certificate_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'minted' AND (OLD.status IS NULL OR OLD.status != 'minted') THEN
        UPDATE public.profiles 
        SET total_certificates_issued = total_certificates_issued + 1
        WHERE id = NEW.issuer_user_id;
        
        UPDATE public.groups 
        SET learner_count = learner_count + 1
        WHERE id = NEW.group_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_certificate_counts AFTER INSERT OR UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION increment_issuer_certificate_count();

-- =====================================================
-- 10. STORAGE BUCKETS (Run in Supabase Dashboard)
-- =====================================================
-- Note: Create these buckets manually in Supabase Dashboard -> Storage
-- 1. certificate-templates (public bucket for PDF templates)
-- 2. certificate-pdfs (public bucket for generated certificates)

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- After running this schema:
-- 1. Create storage buckets in Supabase Dashboard
-- 2. Verify RLS policies are enabled
-- 3. Test with your backend API

COMMENT ON TABLE public.profiles IS 'Extended user profiles with wallet information';
COMMENT ON TABLE public.groups IS 'Certificate groups/courses with join codes';
COMMENT ON TABLE public.certificate_templates IS 'PDF templates for certificates';
COMMENT ON TABLE public.template_fields IS 'Dynamic fields on certificate templates';
COMMENT ON TABLE public.certificates IS 'Issued certificates with blockchain NFT data';
COMMENT ON TABLE public.nft_metadata IS 'NFT metadata stored on blockchain';
COMMENT ON TABLE public.collections IS 'NFT collections on blockchain';
