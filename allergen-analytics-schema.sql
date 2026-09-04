-- Tabla para registrar eventos de interacción anónimos (Filtros de alérgenos, clics en platos, etc.)
CREATE TABLE IF NOT EXISTS public.interaction_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    event_type TEXT NOT NULL, -- Ej: 'allergen_filter', 'featured_dish_click'
    event_value TEXT,         -- Ej: 'gluten', 'dairy'
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para mejorar la velocidad de las consultas de analíticas
CREATE INDEX IF NOT EXISTS idx_interaction_events_type ON public.interaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_interaction_events_created ON public.interaction_events(created_at);

-- Habilitar RLS (Row Level Security) - Solo inserción pública, lectura administración
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede insertar un evento (Anónimamente)
CREATE POLICY "Public insert interaction events" 
ON public.interaction_events FOR INSERT 
TO anon 
WITH CHECK (true);

-- Política: Solo el rol de servicio o admin puede leer los eventos
CREATE POLICY "Admin read interaction events" 
ON public.interaction_events FOR SELECT 
TO service_role 
USING (true);
