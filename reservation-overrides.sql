-- Tabla para bloqueos manuales por día específico
CREATE TABLE IF NOT EXISTS public.reservation_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_date DATE NOT NULL UNIQUE,
    is_accepting_inside BOOLEAN DEFAULT true,
    is_accepting_terrace BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reservation_overrides ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso total al service role
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reservation_overrides' 
        AND policyname = 'Allow service role all'
    ) THEN
        CREATE POLICY "Allow service role all" ON public.reservation_overrides FOR ALL USING (true);
    END IF;
END $$;
