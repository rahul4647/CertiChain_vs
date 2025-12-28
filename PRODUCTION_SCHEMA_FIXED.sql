-- CertiChain Production Database Schema (Safe to Re-run)
-- This version drops existing policies before creating new ones

-- =====================================================
-- DROP EXISTING POLICIES FIRST
-- =====================================================

-- Instructors policies
DROP POLICY IF EXISTS "Users can view own instructor profile" ON public.instructors;
DROP POLICY IF EXISTS "Users can update own instructor profile" ON public.instructors;

-- Groups policies
DROP POLICY IF EXISTS "Anyone can view active groups" ON public.groups;

-- Certificate templates policies
DROP POLICY IF EXISTS "Anyone can view templates" ON public.certificate_templates;

-- Template fields policies
DROP POLICY IF EXISTS "Anyone can view template fields" ON public.template_fields;

-- Certificates policies
DROP POLICY IF EXISTS "Anyone can view valid certificates" ON public.certificates;

-- Certificate verifications policies
DROP POLICY IF EXISTS "Anyone can create verifications" ON public.certificate_verifications;

-- User wallets policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;

-- Collections policies
DROP POLICY IF EXISTS "Anyone can view collections" ON public.collections;

-- =====================================================
-- 1. INSTRUCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
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

CREATE POLICY "Users can insert instructor profile" ON public.instructors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID,
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

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Instructors can update own groups" ON public.groups
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.instructors 
    WHERE instructors.id = groups.instructor_id 
    AND instructors.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_instructor ON public.groups(instructor_id);

-- =====================================================
-- 3. CERTIFICATE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID,
  pdf_url TEXT NOT NULL,
  template_hash TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates" ON public.certificate_templates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create templates" ON public.certificate_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_templates_group_id ON public.certificate_templates(group_id);

-- =====================================================
-- 4. TEMPLATE FIELDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID,
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

CREATE POLICY "Authenticated users can create fields" ON public.template_fields
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_fields_template_id ON public.template_fields(template_id);

-- =====================================================
-- 5. CERTIFICATES TABLE (Main Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL,
  group_id UUID,
  claimed_by_user_id UUID,
  
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

CREATE POLICY "Authenticated users can create certificates" ON public.certificates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_group_id ON public.certificates(group_id);
CREATE INDEX IF NOT EXISTS idx_certificates_claimed_by ON public.certificates(claimed_by_user_id);

-- =====================================================
-- 6. CERTIFICATE VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_pk UUID,
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

CREATE POLICY "Anyone can view verifications" ON public.certificate_verifications
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_verifications_certificate ON public.certificate_verifications(certificate_pk);

-- =====================================================
-- 7. USER WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
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

CREATE POLICY "Users can update own wallet" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);

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
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collections" ON public.collections
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- 9. ADD FOREIGN KEY CONSTRAINTS (only if not exists)
-- =====================================================

-- Drop existing constraints first to avoid conflicts
DO $$ 
BEGIN
  -- Groups -> Instructors
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_groups_instructor' 
             AND table_name = 'groups') THEN
    ALTER TABLE public.groups DROP CONSTRAINT fk_groups_instructor;
  END IF;
  
  ALTER TABLE public.groups 
  ADD CONSTRAINT fk_groups_instructor 
  FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;

  -- Groups -> Templates
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_groups_template' 
             AND table_name = 'groups') THEN
    ALTER TABLE public.groups DROP CONSTRAINT fk_groups_template;
  END IF;
  
  ALTER TABLE public.groups 
  ADD CONSTRAINT fk_groups_template 
  FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;

  -- Templates -> Groups
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_templates_group' 
             AND table_name = 'certificate_templates') THEN
    ALTER TABLE public.certificate_templates DROP CONSTRAINT fk_templates_group;
  END IF;
  
  ALTER TABLE public.certificate_templates 
  ADD CONSTRAINT fk_templates_group 
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

  -- Template Fields -> Templates
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_fields_template' 
             AND table_name = 'template_fields') THEN
    ALTER TABLE public.template_fields DROP CONSTRAINT fk_fields_template;
  END IF;
  
  ALTER TABLE public.template_fields 
  ADD CONSTRAINT fk_fields_template 
  FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE CASCADE;

  -- Certificates -> Groups
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_certificates_group' 
             AND table_name = 'certificates') THEN
    ALTER TABLE public.certificates DROP CONSTRAINT fk_certificates_group;
  END IF;
  
  ALTER TABLE public.certificates 
  ADD CONSTRAINT fk_certificates_group 
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

  -- Verifications -> Certificates
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_verifications_certificate' 
             AND table_name = 'certificate_verifications') THEN
    ALTER TABLE public.certificate_verifications DROP CONSTRAINT fk_verifications_certificate;
  END IF;
  
  ALTER TABLE public.certificate_verifications 
  ADD CONSTRAINT fk_verifications_certificate 
  FOREIGN KEY (certificate_pk) REFERENCES public.certificates(id) ON DELETE CASCADE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some foreign keys may already exist: %', SQLERRM;
END $$;

-- =====================================================
-- 10. FUNCTIONS & TRIGGERS
-- =====================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_instructors_updated_at ON public.instructors;
DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
DROP TRIGGER IF EXISTS update_certificate_count ON public.certificates;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment certificate count function
CREATE OR REPLACE FUNCTION increment_certificate_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.instructors 
    SET total_certificates_issued = total_certificates_issued + 1
    WHERE id = (SELECT instructor_id FROM public.groups WHERE id = NEW.group_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_certificate_count AFTER INSERT ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION increment_certificate_count();

-- =====================================================
-- DONE!
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Schema update completed successfully!';
  RAISE NOTICE 'Tables: instructors, groups, certificate_templates, template_fields, certificates, certificate_verifications, user_wallets, collections';
  RAISE NOTICE 'Next step: Create storage buckets in Supabase Dashboard';
  RAISE NOTICE '  - certificate-templates (public)';
  RAISE NOTICE '  - certificate-pdfs (public)';
END $$;
