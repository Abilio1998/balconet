-- ================================================================
-- El Balconet — Añadir columnas que faltan en carta_products
-- y carta_categories para que el Dashboard funcione correctamente.
-- Ejecutar en: Supabase SQL Editor → New query → Run
-- ================================================================

-- CARTA_PRODUCTS: añadir columnas que usa el dashboard
ALTER TABLE public.carta_products
  ADD COLUMN IF NOT EXISTS is_web_featured  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_lunch    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_dinner   BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_breakfast BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_ficha    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_days   TEXT[] DEFAULT '{mon,tue,wed,thu,fri,sat,sun}',
  ADD COLUMN IF NOT EXISTS supplements      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS promo_schedules  JSONB DEFAULT '[]'::jsonb;

-- CARTA_CATEGORIES: añadir columnas que usa el dashboard
ALTER TABLE public.carta_categories
  ADD COLUMN IF NOT EXISTS hide_in_full     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_ficha    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pdf_layout_lunch  TEXT DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS pdf_layout_dinner TEXT DEFAULT 'classic';

-- Recargar caché de Supabase (muy importante)
NOTIFY pgrst, 'reload schema';
