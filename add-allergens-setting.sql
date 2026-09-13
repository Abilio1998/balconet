-- Ejecuta esto en el SQL Editor de Supabase
ALTER TABLE public.reservation_settings
ADD COLUMN IF NOT EXISTS show_allergens_in_web BOOLEAN DEFAULT true;
