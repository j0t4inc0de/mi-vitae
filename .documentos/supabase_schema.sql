-- =========================================================================
-- MI VITAE — Esquema Relacional de Base de Datos para Supabase (PostgreSQL)
-- Metodología XP (Iteración 6: Backend Cloud & Autenticación Real)
-- =========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: profiles (Portafolios de usuarios)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    personal_info JSONB DEFAULT '{}'::jsonb,
    theme TEXT DEFAULT 'tech' NOT NULL,
    plan TEXT DEFAULT 'free_trial' NOT NULL,
    plan_name TEXT DEFAULT '1er Mes Gratis ($0 CLP)' NOT NULL,
    plan_status TEXT DEFAULT 'active' NOT NULL,
    trial_activated_at TIMESTAMPTZ DEFAULT NOW(),
    plan_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    floating_button JSONB DEFAULT '{"type": "whatsapp", "active": true}'::jsonb,
    analytics JSONB DEFAULT '{"views": 0, "contactClicks": 0, "cvDownloads": 0}'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda ágil
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- 3. TABLA: feedbacks (Respuestas de la encuesta de activación del 1er mes)
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT,
    career_area TEXT,
    main_cv_obstacle TEXT,
    referral_source TEXT,
    additional_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: subscriptions (Historial de transacciones y pagos Flow.cl)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    amount NUMERIC DEFAULT 3490 NOT NULL,
    currency TEXT DEFAULT 'CLP' NOT NULL,
    payment_method TEXT,
    authorization_code TEXT,
    status TEXT DEFAULT 'APROBADO' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SEGURIDAD & POLÍTICAS ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: profiles
-- Cualquiera en internet puede ver un portafolio público:
CREATE POLICY "Portafolios públicos son visibles por cualquiera" 
ON public.profiles FOR SELECT 
USING (true);

-- Solo el dueño autenticado puede editar su portafolio:
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Solo el dueño autenticado puede crear su perfil:
CREATE POLICY "Usuarios pueden insertar su propio perfil" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- POLÍTICAS: feedbacks
CREATE POLICY "Usuarios autenticados pueden registrar su feedback" 
ON public.feedbacks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lectura de feedback restringida al creador" 
ON public.feedbacks FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- POLÍTICAS: subscriptions
CREATE POLICY "Usuarios pueden consultar sus suscripciones" 
ON public.subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- =========================================================================
-- TRIGGER: Manejo automático de actualización de timestamp
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- =========================================================================
-- TRIGGER: Creación automática de perfil al registrarse en auth.users
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    desired_username TEXT;
    desired_name TEXT;
BEGIN
    desired_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
    desired_name := COALESCE(NEW.raw_user_meta_data->>'full_name', desired_username);

    INSERT INTO public.profiles (id, username, personal_info, theme, plan, plan_name)
    VALUES (
        NEW.id,
        LOWER(desired_username),
        jsonb_build_object(
            'name', desired_name,
            'email', NEW.email,
            'title', 'Profesional en Mi Vitae',
            'bio', 'Bienvenido a mi portafolio profesional en línea.',
            'availableForWork', true
        ),
        'tech',
        'free_trial',
        '1er Mes Gratis ($0 CLP)'
    )
    ON CONFLICT (username) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
