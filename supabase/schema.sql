-- ==============================================================================
-- MI VITAE (by We Are Samod) — Supabase Cloud Database Architecture
-- Iteración 6: Infraestructura Serverless PostgreSQL & Auth
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: PROFILES (User Digital Portfolios)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  personal_info JSONB NOT NULL DEFAULT '{
    "name": "",
    "title": "Profesional",
    "bio": "",
    "email": "",
    "phone": "",
    "location": "Chile",
    "avatar": "",
    "availableForWork": true
  }'::jsonb,
  theme VARCHAR(30) NOT NULL DEFAULT 'tech',
  plan VARCHAR(30) NOT NULL DEFAULT 'free_trial',
  plan_name VARCHAR(100) NOT NULL DEFAULT '1er Mes Gratis ($0 CLP)',
  plan_status VARCHAR(20) NOT NULL DEFAULT 'active',
  floating_button JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "text": "Hablemos por WhatsApp",
    "actionType": "whatsapp",
    "customLink": ""
  }'::jsonb,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  qr_code JSONB NOT NULL DEFAULT '{}'::jsonb,
  analytics JSONB NOT NULL DEFAULT '{
    "views": 0,
    "contactClicks": 0,
    "cvDownloads": 0
  }'::jsonb,
  feedback_survey_completed BOOLEAN NOT NULL DEFAULT false,
  trial_activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plan_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABLE: FEEDBACKS (Onboarding survey responses)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(50),
  professional_area VARCHAR(100),
  cv_obstacle TEXT,
  referral_source VARCHAR(100),
  rating INT DEFAULT 5,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABLE: SUBSCRIPTIONS (User Billing & Subscription Lifecycle)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  plan_type VARCHAR(30) NOT NULL DEFAULT 'free_trial', -- 'free_trial', 'premium', 'agency'
  status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'expired'
  price_clp NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  flow_subscription_id VARCHAR(100),
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABLE: TRANSACTIONS (Flow.cl Payment Records & Vouchers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  flow_order_number VARCHAR(100),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(50),
  amount NUMERIC NOT NULL DEFAULT 3490,
  currency VARCHAR(10) NOT NULL DEFAULT 'CLP',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO'
  payment_method VARCHAR(100),
  authorization_code VARCHAR(100),
  payer_email VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_feedbacks_username ON public.feedbacks (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_order_number ON public.transactions (order_number);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);

-- ==============================================================================
-- 7. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. AUTOMATIC PROFILE INITIALIZATION ON AUTH.USERS INSERT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username VARCHAR(50);
  extracted_name VARCHAR(255);
BEGIN
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    'Profesional en Mi Vitae'
  );

  -- Insert default profile row for new user
  INSERT INTO public.profiles (
    id,
    username,
    personal_info,
    theme,
    plan,
    plan_name,
    plan_status,
    trial_activated_at,
    plan_expires_at
  ) VALUES (
    NEW.id,
    LOWER(TRIM(extracted_username)),
    jsonb_build_object(
      'name', extracted_name,
      'email', NEW.email,
      'title', 'Profesional en Mi Vitae',
      'bio', 'Bienvenido a mi portafolio profesional en línea.',
      'availableForWork', true
    ),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'tech'),
    'free_trial',
    '1er Mes Gratis ($0 CLP)',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert initial free trial subscription
  INSERT INTO public.subscriptions (
    user_id,
    username,
    plan_type,
    status,
    price_clp,
    started_at,
    expires_at,
    trial_ends_at
  ) VALUES (
    NEW.id,
    LOWER(TRIM(extracted_username)),
    'free_trial',
    'active',
    0,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES:
-- 1) Anyone (including unauthenticated visitors) can view public portfolios
CREATE POLICY "Public portfolios are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

-- 2) Authenticated users can insert their own profile
CREATE POLICY "Users can create their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3) Authenticated users can update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 4) Public can increment views/analytics via stored procedure or open update for analytics
CREATE POLICY "Allow analytics updates on profile"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- FEEDBACKS POLICIES:
-- Anyone (signed in or anonymous during onboarding) can submit feedback
CREATE POLICY "Anyone can submit onboarding feedback" 
  ON public.feedbacks FOR INSERT 
  WITH CHECK (true);

-- Only user or service_role can view submitted feedback
CREATE POLICY "Users can view own feedback or service role" 
  ON public.feedbacks FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- SUBSCRIPTIONS POLICIES:
CREATE POLICY "Users can view own subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions" 
  ON public.subscriptions FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- TRANSACTIONS POLICIES:
CREATE POLICY "Users can view own transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Anyone or service role can insert transactions" 
  ON public.transactions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions" 
  ON public.transactions FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==============================================================================
-- 10. RPC FUNCTION: INCREMENT ANALYTICS (Atomic counter)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.increment_analytics(
  target_username TEXT,
  metric_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  IF metric_name = 'views' THEN
    UPDATE public.profiles
    SET analytics = jsonb_set(
      analytics, 
      '{views}', 
      to_jsonb(COALESCE((analytics->>'views')::int, 0) + 1)
    )
    WHERE LOWER(username) = LOWER(TRIM(target_username))
    RETURNING analytics INTO result;
  ELSIF metric_name = 'contactClicks' THEN
    UPDATE public.profiles
    SET analytics = jsonb_set(
      analytics, 
      '{contactClicks}', 
      to_jsonb(COALESCE((analytics->>'contactClicks')::int, 0) + 1)
    )
    WHERE LOWER(username) = LOWER(TRIM(target_username))
    RETURNING analytics INTO result;
  ELSIF metric_name = 'cvDownloads' THEN
    UPDATE public.profiles
    SET analytics = jsonb_set(
      analytics, 
      '{cvDownloads}', 
      to_jsonb(COALESCE((analytics->>'cvDownloads')::int, 0) + 1)
    )
    WHERE LOWER(username) = LOWER(TRIM(target_username))
    RETURNING analytics INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
