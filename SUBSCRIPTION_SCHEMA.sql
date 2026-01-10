-- CertiChain Subscription System Schema Update
-- Run this in Supabase SQL Editor to add subscription/freemium features

-- =====================================================
-- ADD SUBSCRIPTION COLUMNS TO INSTRUCTORS TABLE
-- =====================================================

-- Add subscription_type column (free or pro)
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free' 
CHECK (subscription_type IN ('free', 'pro'));

-- Add subscription expiration date for Pro users
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Add mint credits column
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS mint_credits INTEGER DEFAULT 5;

-- Comment the new columns
COMMENT ON COLUMN public.instructors.subscription_type IS 'User subscription type: free or pro';
COMMENT ON COLUMN public.instructors.subscription_expires_at IS 'Pro subscription expiration date';
COMMENT ON COLUMN public.instructors.mint_credits IS 'Available mint credits for certificate minting';

-- =====================================================
-- CREATE SUBSCRIPTION TRANSACTIONS TABLE (OPTIONAL)
-- For tracking subscription and credit purchases
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('upgrade', 'credit_purchase', 'credit_used')),
  amount DECIMAL(10, 2),
  credits_amount INTEGER,
  package_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.subscription_transactions
  FOR SELECT USING (
    instructor_id IN (
      SELECT id FROM public.instructors WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_sub_transactions_instructor 
ON public.subscription_transactions(instructor_id);

-- =====================================================
-- UPDATE EXISTING FREE USERS WITH DEFAULT CREDITS
-- =====================================================
UPDATE public.instructors 
SET mint_credits = 5 
WHERE mint_credits IS NULL AND subscription_type = 'free';

-- =====================================================
-- SUBSCRIPTION LIMITS REFERENCE
-- =====================================================
-- FREE PLAN:
--   - Max 2 groups
--   - 5 mint credits (one-time, cannot recharge)
--
-- PRO PLAN:
--   - Unlimited groups (while subscription active)
--   - Credit packages:
--     - Starter: 50 credits = $9.99
--     - Basic: 100 credits = $19.99
--     - Standard: 250 credits = $39.99
--     - Premium: 500 credits = $69.99
--     - Enterprise: 1000 credits = $119.99

-- =====================================================
-- SCHEMA UPDATE COMPLETE
-- =====================================================
