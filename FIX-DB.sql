-- ================================================================
-- PATCH de actualización para El Balconet (Columnas faltantes)
-- Pega esto en Supabase y dale a RUN para arreglar el error 500
-- ================================================================

-- 1. Añadir columnas a reservation_settings
ALTER TABLE public.reservation_settings
ADD COLUMN IF NOT EXISTS breakfast_start TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS breakfast_end TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS breakfast_menu_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS lunch_menu_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dinner_menu_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disable_web_reservations BOOLEAN DEFAULT false;

-- 2. Añadir columnas a carta_products
ALTER TABLE public.carta_products
ADD COLUMN IF NOT EXISTS show_in_breakfast BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_schedules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. Añadir columnas a daily_menus
ALTER TABLE public.daily_menus 
ADD COLUMN IF NOT EXISTS price_exterior NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN NOT NULL DEFAULT false;

-- 4. Añadir columnas a reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS table_name TEXT,
ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ;

-- 5. Añadir columnas a carta_categories
ALTER TABLE public.carta_categories 
ADD COLUMN IF NOT EXISTS pdf_layout_lunch VARCHAR(50) DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS pdf_layout_dinner VARCHAR(50) DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
