-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    guests INTEGER NOT NULL DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'cancelled', 'noshow')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Configuración de Reservas
CREATE TABLE IF NOT EXISTS public.reservation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    max_capacity_per_slot INTEGER NOT NULL DEFAULT 20,
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    lunch_start TIME DEFAULT '13:00',
    lunch_end TIME DEFAULT '15:30',
    dinner_start TIME DEFAULT '20:30',
    dinner_end TIME DEFAULT '23:00',
    closed_days INTEGER[] DEFAULT '{1}', -- Por ejemplo Lunes (1)
    large_group_threshold INTEGER DEFAULT 8,
    whatsapp_number TEXT DEFAULT '34600000000',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar configuración inicial
INSERT INTO public.reservation_settings (max_capacity_per_slot, slot_interval_minutes, lunch_start, lunch_end, dinner_start, dinner_end, closed_days)
VALUES (20, 30, '13:00', '15:30', '20:30', '23:00', '{1}')
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_settings ENABLE ROW LEVEL SECURITY;

-- Políticas sencillas (pueden ajustarse según auth)
CREATE POLICY "Allow public insert for reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select for settings" ON public.reservation_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin full access reservations" ON public.reservations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access settings" ON public.reservation_settings FOR ALL USING (auth.role() = 'authenticated');
