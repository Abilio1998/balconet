-- 1. Crear tabla para planificación semanal de personal
CREATE TABLE IF NOT EXISTS public.billing_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_monday DATE NOT NULL,
  schedule_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índice único para evitar duplicados por semana
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_weekly_schedules_week ON public.billing_weekly_schedules(week_monday);
