-- ================================================================
-- El Balconet - Script SQL Maestro para Supabase
-- Proyecto: patzzbqvdbvgsoxvwjpg
-- Instrucciones: Pega TODO este archivo en el SQL Editor de
-- Supabase (https://supabase.com/dashboard/project/patzzbqvdbvgsoxvwjpg/sql/new)
-- y haz clic en "Run"
-- ================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ================================================================
-- 0. LIMPIEZA PREVIA (Borra todo para instalación limpia)
-- ================================================================
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS daily_menus CASCADE;
DROP TABLE IF EXISTS carta_images CASCADE;
DROP TABLE IF EXISTS hero_images CASCADE;
DROP TABLE IF EXISTS carta_products CASCADE;
DROP TABLE IF EXISTS carta_categories CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS reservation_settings CASCADE;
DROP TABLE IF EXISTS reservation_overrides CASCADE;
DROP TABLE IF EXISTS interaction_events CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_rewards CASCADE;
DROP TABLE IF EXISTS loyalty_settings CASCADE;
DROP TABLE IF EXISTS loyalty_clients CASCADE;
DROP TABLE IF EXISTS billing_weekly_schedules CASCADE;

-- ================================================================
-- 1. DAILY MENUS
-- ================================================================
create table if not exists daily_menus (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  price       numeric(5,2) not null default 14.00,
  published   boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ================================================================
-- 2. DISHES (linked to daily_menus)
-- ================================================================
create table if not exists dishes (
  id             uuid primary key default gen_random_uuid(),
  menu_id        uuid not null references daily_menus(id) on delete cascade,
  name           text not null check (char_length(name) <= 200),
  description    text check (char_length(description) <= 500),
  course         text not null check (course in ('first', 'second', 'dessert')),
  order_index    integer not null default 0,
  created_at     timestamptz default now()
);
create index if not exists dishes_menu_id_idx on dishes(menu_id);

-- Traducciones de platos
alter table "public"."dishes"
add column if not exists "name_ca" text,
add column if not exists "name_en" text,
add column if not exists "name_fr" text,
add column if not exists "description_ca" text,
add column if not exists "description_en" text,
add column if not exists "description_fr" text;

-- Suplemento y alérgenos
alter table dishes add column if not exists supplement numeric(5,2) default 0;
alter table dishes add column if not exists allergens text[] default '{}';

-- ================================================================
-- 3. CARTA IMAGES
-- ================================================================
create table if not exists carta_images (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  alt         text not null default 'Imagen El Balconet',
  order_index integer not null default 0,
  created_at  timestamptz default now()
);

-- ================================================================
-- 4. HERO IMAGES
-- ================================================================
create table if not exists hero_images (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  alt         text not null default 'El Balconet hero',
  order_index integer not null default 0,
  created_at  timestamptz default now()
);

-- ================================================================
-- 5. CARTA CATEGORIES (Carta dinámica)
-- ================================================================
create table if not exists carta_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_ca     text,
  name_en     text,
  name_fr     text,
  order_index integer not null default 0,
  is_visible  boolean default true,
  created_at  timestamptz default now()
);

-- ================================================================
-- 6. CARTA PRODUCTS
-- ================================================================
create table if not exists carta_products (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references carta_categories(id) on delete cascade,
  name           text not null,
  name_ca        text,
  name_en        text,
  name_fr        text,
  description    text,
  description_ca text,
  description_en text,
  description_fr text,
  price          numeric(5,2),
  price_exterior numeric(5,2),
  allergens      text[] default '{}',
  image_url      text,
  image_alt      text,
  is_featured    boolean default false,
  is_visible     boolean default true,
  order_index    integer not null default 0,
  created_at     timestamptz default now()
);

-- ================================================================
-- 7. RESERVATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    guests INTEGER NOT NULL DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'cancelled', 'noshow')),
    notes TEXT,
    mesa TEXT,
    seated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- 8. RESERVATION SETTINGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reservation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    max_capacity_per_slot INTEGER NOT NULL DEFAULT 20,
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    lunch_start TIME DEFAULT '13:00',
    lunch_end TIME DEFAULT '15:30',
    dinner_start TIME DEFAULT '20:30',
    dinner_end TIME DEFAULT '23:00',
    closed_days INTEGER[] DEFAULT '{1}',
    large_group_threshold INTEGER DEFAULT 8,
    whatsapp_number TEXT DEFAULT '34679121045',
    is_active BOOLEAN DEFAULT true,
    disable_web_reservations BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.reservation_settings (max_capacity_per_slot, slot_interval_minutes, lunch_start, lunch_end, dinner_start, dinner_end, closed_days, whatsapp_number)
VALUES (20, 30, '13:00', '15:30', '20:30', '23:00', '{1}', '34679121045')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 9. RESERVATION OVERRIDES (bloqueos manuales)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reservation_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_date DATE NOT NULL UNIQUE,
    is_accepting_inside BOOLEAN DEFAULT true,
    is_accepting_terrace BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- 10. INTERACTION EVENTS (analytics)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.interaction_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    event_type TEXT NOT NULL,
    event_value TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_interaction_events_type ON public.interaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_interaction_events_created ON public.interaction_events(created_at);

-- ================================================================
-- 11. LOYALTY CLIENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    magic_token UUID DEFAULT gen_random_uuid(),
    restaurant_name TEXT DEFAULT 'El Balconet',
    last_activity TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- 12. LOYALTY TRANSACTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.loyalty_clients(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL,
    restaurant_name TEXT DEFAULT 'El Balconet',
    amount NUMERIC(10,2) NOT NULL,
    points_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_transactions_invoice_restaurant_unique') THEN
        ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_invoice_restaurant_unique UNIQUE (restaurant_name, invoice_id);
    END IF;
END $$;

-- ================================================================
-- 13. LOYALTY REWARDS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.loyalty_clients(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- 14. LOYALTY SETTINGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    points_per_euro INTEGER DEFAULT 1,
    points_threshold INTEGER DEFAULT 100,
    reward_name TEXT DEFAULT 'Consumición Gratis',
    reward_message_template TEXT DEFAULT '¡Hola {name}! Has ganado un premio: {reward}. Canjéalo en máximo 2 semanas.',
    reward_validity_days INTEGER DEFAULT 14,
    points_expiration_months INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.loyalty_settings (points_per_euro, points_threshold, reward_name, reward_validity_days, points_expiration_months)
SELECT 1, 100, 'Consumición Gratis', 14, 0
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_settings);

-- ================================================================
-- 15. BILLING WEEKLY SCHEDULES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.billing_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_monday DATE NOT NULL,
  schedule_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_weekly_schedules_week ON public.billing_weekly_schedules(week_monday);

-- ================================================================
-- 16. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- daily_menus
alter table daily_menus enable row level security;
create policy "Public read published menus" on daily_menus for select using (published = true);

-- dishes
alter table dishes enable row level security;
create policy "Public read dishes from published menus" on dishes for select
  using (exists (select 1 from daily_menus m where m.id = dishes.menu_id and m.published = true));

-- carta_images
alter table carta_images enable row level security;
create policy "Public read carta images" on carta_images for select using (true);

-- hero_images
alter table hero_images enable row level security;
create policy "Public read hero images" on hero_images for select using (true);

-- carta_categories
alter table "public"."carta_categories" enable row level security;
create policy "Public read carta categories" on "public"."carta_categories" for select using (true);

-- carta_products
alter table "public"."carta_products" enable row level security;
create policy "Public read carta products" on "public"."carta_products" for select using (true);

-- reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert for reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select for settings" ON public.reservation_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin full access reservations" ON public.reservations FOR ALL USING (auth.role() = 'authenticated');

-- reservation_settings
ALTER TABLE public.reservation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access settings" ON public.reservation_settings FOR ALL USING (auth.role() = 'authenticated');

-- reservation_overrides
ALTER TABLE public.reservation_overrides ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservation_overrides' AND policyname = 'Allow service role all') THEN
        CREATE POLICY "Allow service role all" ON public.reservation_overrides FOR ALL USING (true);
    END IF;
END $$;

-- interaction_events
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert interaction events" ON public.interaction_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin read interaction events" ON public.interaction_events FOR SELECT TO service_role USING (true);

-- loyalty_clients
ALTER TABLE public.loyalty_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_clients" ON public.loyalty_clients;
DROP POLICY IF EXISTS "Public read own points" ON public.loyalty_clients;
CREATE POLICY "Admin full access loyalty_clients" ON public.loyalty_clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read own points" ON public.loyalty_clients FOR SELECT USING (true);

-- loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_transactions" ON public.loyalty_transactions;
CREATE POLICY "Admin full access loyalty_transactions" ON public.loyalty_transactions FOR ALL USING (auth.role() = 'authenticated');

-- loyalty_rewards
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Public read own rewards" ON public.loyalty_rewards;
CREATE POLICY "Admin full access loyalty_rewards" ON public.loyalty_rewards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read own rewards" ON public.loyalty_rewards FOR SELECT USING (true);

-- loyalty_settings
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access loyalty_settings" ON public.loyalty_settings;
DROP POLICY IF EXISTS "Public read loyalty_settings" ON public.loyalty_settings;
CREATE POLICY "Admin full access loyalty_settings" ON public.loyalty_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read loyalty_settings" ON public.loyalty_settings FOR SELECT USING (true);

-- ================================================================
-- 17. HELPER: updated_at trigger
-- ================================================================
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on daily_menus
  for each row execute function update_updated_at_column();

-- ================================================================
-- FIN DEL SCRIPT — El Balconet está listo 🎉
-- ================================================================
