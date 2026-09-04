-- Añadir la columna de Mesa (table_name) a la tabla de reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS table_name TEXT;
