-- Actualizar el constraint de la columna 'status' en la tabla de reservations
-- Paso 1: Eliminar el constraint anterior de CHECK
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Paso 2: Crear el nuevo constraint añadiendo 'completed'
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('confirmed', 'seated', 'cancelled', 'noshow', 'completed'));
