-- Add Missing Columns to Existing Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ADD MISSING COLUMNS TO CERTIFICATES
-- =====================================================
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS recipient_wallet TEXT,
ADD COLUMN IF NOT EXISTS pdf_ipfs_cid TEXT,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS qr_code_image TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 2. ADD MISSING COLUMNS TO GROUPS
-- =====================================================
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS collection_id TEXT,
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key for template_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'groups_template_id_fkey' 
    AND table_name = 'groups'
  ) THEN
    ALTER TABLE public.groups 
    ADD CONSTRAINT groups_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 3. ADD MISSING COLUMNS TO TEMPLATE_FIELDS
-- =====================================================
ALTER TABLE public.template_fields 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'qr')),
ADD COLUMN IF NOT EXISTS qr_image TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 4. ADD MISSING COLUMNS TO INSTRUCTORS
-- =====================================================
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS total_certificates_issued INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 5. ADD UPDATE TRIGGERS
-- =====================================================

-- Create update function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
DROP TRIGGER IF EXISTS update_instructors_updated_at ON public.instructors;
DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;

-- Create triggers
CREATE TRIGGER update_certificates_updated_at 
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at 
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at 
BEFORE UPDATE ON public.instructors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at 
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ADD CERTIFICATE COUNT TRIGGER
-- =====================================================

-- Create function to increment certificate count
CREATE OR REPLACE FUNCTION increment_certificate_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.instructors 
    SET total_certificates_issued = total_certificates_issued + 1
    WHERE id = (
        SELECT instructor_id 
        FROM public.groups 
        WHERE id = NEW.group_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_certificate_count ON public.certificates;

-- Create trigger
CREATE TRIGGER update_certificate_count 
AFTER INSERT ON public.certificates
FOR EACH ROW EXECUTE FUNCTION increment_certificate_count();

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_group_id ON public.certificates(group_id);
CREATE INDEX IF NOT EXISTS idx_certificates_claimed_by ON public.certificates(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_nft_id ON public.certificates(nft_id);

CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);
CREATE INDEX IF NOT EXISTS idx_groups_instructor ON public.groups(instructor_id);
CREATE INDEX IF NOT EXISTS idx_groups_template ON public.groups(template_id);

CREATE INDEX IF NOT EXISTS idx_templates_group ON public.certificate_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_fields_template ON public.template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_verifications_cert ON public.certificate_verifications(certificate_pk);
CREATE INDEX IF NOT EXISTS idx_instructors_user ON public.instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_wallet ON public.instructors(wallet_address);

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY (if not already)
-- =====================================================
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. ADD RLS POLICIES (if they don't exist)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view valid certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can view active groups" ON public.groups;
DROP POLICY IF EXISTS "Anyone can view templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "Anyone can view template fields" ON public.template_fields;
DROP POLICY IF EXISTS "Anyone can create verifications" ON public.certificate_verifications;

-- Create policies
CREATE POLICY "Anyone can view valid certificates" ON public.certificates
  FOR SELECT USING (status = 'valid');

CREATE POLICY "Anyone can view active groups" ON public.groups
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can view templates" ON public.certificate_templates
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view template fields" ON public.template_fields
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create verifications" ON public.certificate_verifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- DONE!
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Schema updated successfully!';
  RAISE NOTICE 'Added missing columns:';
  RAISE NOTICE '  - certificates: recipient_wallet, pdf_ipfs_cid, qr_code_data, qr_code_image, timestamps';
  RAISE NOTICE '  - groups: collection_id, contract_address, template_id, updated_at';
  RAISE NOTICE '  - template_fields: type, qr_image, created_at';
  RAISE NOTICE '  - instructors: department, total_certificates_issued, updated_at';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage buckets: certificate-templates, certificate-pdfs';
  RAISE NOTICE '2. Test backend: curl http://localhost:8001/api/health';
  RAISE NOTICE '3. Ready to test certificate flow!';
END $$;
