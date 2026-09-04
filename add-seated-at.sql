-- Añadir columna 'seated_at' para rastrear el tiempo real de estancia
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ;
