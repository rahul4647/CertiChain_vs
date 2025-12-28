-- CertiChain Production Database Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. INSTRUCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  wallet_address TEXT UNIQUE,
  private_key_encrypted TEXT,
  department TEXT,
  total_certificates_issued INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instructor profile" ON public.instructors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own instructor profile" ON public.instructors
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 2. GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  collection_id TEXT,
  contract_address TEXT,
  template_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active groups" ON public.groups
  FOR SELECT USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_instructor ON public.groups(instructor_id);

-- =====================================================
-- 3. CERTIFICATE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  template_hash TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.certificate_templates
  FOR SELECT USING (true);

-- =====================================================
-- 4. TEMPLATE FIELDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  label TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'qr')),
  qr_image TEXT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  field_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view template fields" ON public.template_fields
  FOR SELECT USING (true);

-- =====================================================
-- 5. CERTIFICATES TABLE (Main Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Certificate Data
  canonical_payload JSONB NOT NULL,
  certificate_hash TEXT NOT NULL,
  issuer_signature TEXT NOT NULL,
  
  -- NFT Data
  nft_id TEXT,
  contract_address TEXT,
  token_id TEXT,
  blockchain_tx TEXT,
  recipient_wallet TEXT,
  
  -- IPFS & QR
  ipfs_url TEXT,
  pdf_ipfs_cid TEXT,
  qr_code_data TEXT,
  qr_code_image TEXT,
  verification_url TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'pending')),
  
  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view valid certificates" ON public.certificates
  FOR SELECT USING (status = 'valid');

CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_group_id ON public.certificates(group_id);
CREATE INDEX IF NOT EXISTS idx_certificates_claimed_by ON public.certificates(claimed_by_user_id);

-- =====================================================
-- 6. CERTIFICATE VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_pk UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verifier_ip TEXT,
  verifier_user_agent TEXT,
  trust_score INTEGER,
  check_results JSONB,
  result_text TEXT
);

ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create verifications" ON public.certificate_verifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. USER WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  wallet_provider TEXT DEFAULT 'crossmint',
  private_key_encrypted TEXT,
  name TEXT,
  email TEXT UNIQUE,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 8. COLLECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  symbol TEXT,
  chain TEXT DEFAULT 'polygon',
  contract_address TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collections" ON public.collections
  FOR SELECT USING (true);

-- =====================================================
-- 9. FOREIGN KEY CONSTRAINTS
-- =====================================================
ALTER TABLE public.groups 
ADD CONSTRAINT IF NOT EXISTS fk_groups_template 
FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;

-- =====================================================
-- 10. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_instructors_updated_at ON public.instructors;
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment certificate count
CREATE OR REPLACE FUNCTION increment_certificate_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.instructors 
    SET total_certificates_issued = total_certificates_issued + 1
    WHERE id = (SELECT instructor_id FROM public.groups WHERE id = NEW.group_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_certificate_count ON public.certificates;
CREATE TRIGGER update_certificate_count AFTER INSERT ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION increment_certificate_count();

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

COMMENT ON TABLE public.instructors IS 'Instructors with wallet information';
COMMENT ON TABLE public.groups IS 'Certificate groups/courses';
COMMENT ON TABLE public.certificate_templates IS 'PDF templates';
COMMENT ON TABLE public.template_fields IS 'Dynamic fields on templates';
COMMENT ON TABLE public.certificates IS 'Issued certificates with blockchain data';
COMMENT ON TABLE public.certificate_verifications IS 'Verification audit trail';
COMMENT ON TABLE public.user_wallets IS 'User wallet management';
COMMENT ON TABLE public.collections IS 'NFT collections';
