-- Añade la columna is_closed a reservation_overrides para el bloqueo total de días
-- Ejecuta esto en el SQL Editor de Supabase (Balconet)
ALTER TABLE public.reservation_overrides
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;
