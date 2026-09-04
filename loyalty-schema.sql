-- ============================================================
-- LOYALTY CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    magic_token UUID DEFAULT gen_random_uuid(),
    restaurant_name TEXT DEFAULT 'El Balconet', -- Sede principal
    last_activity TIMESTAMPTZ DEFAULT now(),     -- Para caducidad
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existe
ALTER TABLE public.loyalty_clients ADD COLUMN IF NOT EXISTS restaurant_name TEXT DEFAULT 'El Balconet';
ALTER TABLE public.loyalty_clients ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- LOYALTY TRANSACTIONS (Facturas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.loyalty_clients(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL,
    restaurant_name TEXT DEFAULT 'El Balconet', -- Dónde se hizo la factura
    amount NUMERIC(10,2) NOT NULL,
    points_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas y unicidad por sede
ALTER TABLE public.loyalty_transactions ADD COLUMN IF NOT EXISTS restaurant_name TEXT DEFAULT 'El Balconet';
-- Quitar unicidad global de factura si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_transactions_invoice_id_key') THEN
        ALTER TABLE public.loyalty_transactions DROP CONSTRAINT loyalty_transactions_invoice_id_key;
    END IF;
END $$;
-- Añadir unicidad combinada (Restaurante + Factura)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_transactions_invoice_restaurant_unique') THEN
        ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_invoice_restaurant_unique UNIQUE (restaurant_name, invoice_id);
    END IF;
END $$;

-- ============================================================
-- LOYALTY REWARDS (Premios)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.loyalty_clients(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LOYALTY SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    points_per_euro INTEGER DEFAULT 1,
    points_threshold INTEGER DEFAULT 100,
    reward_name TEXT DEFAULT 'Consumición Gratis',
    reward_message_template TEXT DEFAULT '¡Hola {name}! Has ganado un premio: {reward}. Canjéalo en máximo 2 semanas.',
    reward_validity_days INTEGER DEFAULT 14,
    points_expiration_months INTEGER DEFAULT 0, -- 0 = Nunca caduca
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas configurables
ALTER TABLE public.loyalty_settings ADD COLUMN IF NOT EXISTS reward_name TEXT DEFAULT 'Consumición Gratis';
ALTER TABLE public.loyalty_settings ADD COLUMN IF NOT EXISTS points_expiration_months INTEGER DEFAULT 0;

-- Insert configuration if not exists
INSERT INTO public.loyalty_settings (points_per_euro, points_threshold, reward_name, reward_validity_days, points_expiration_months)
SELECT 1, 100, 'Consumición Gratis', 14, 0
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_settings);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Loyalty Clients
ALTER TABLE public.loyalty_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_clients" ON public.loyalty_clients;
DROP POLICY IF EXISTS "Public read own points" ON public.loyalty_clients;
CREATE POLICY "Admin full access loyalty_clients" ON public.loyalty_clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read own points" ON public.loyalty_clients FOR SELECT USING (true);

-- Loyalty Transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_transactions" ON public.loyalty_transactions;
CREATE POLICY "Admin full access loyalty_transactions" ON public.loyalty_transactions FOR ALL USING (auth.role() = 'authenticated');

-- Loyalty Rewards
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Public read own rewards" ON public.loyalty_rewards;
CREATE POLICY "Admin full access loyalty_rewards" ON public.loyalty_rewards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read own rewards" ON public.loyalty_rewards FOR SELECT USING (true);

-- Loyalty Settings
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_settings" ON public.loyalty_settings;
DROP POLICY IF EXISTS "Public read loyalty_settings" ON public.loyalty_settings;
CREATE POLICY "Admin full access loyalty_settings" ON public.loyalty_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read loyalty_settings" ON public.loyalty_settings FOR SELECT USING (true);

