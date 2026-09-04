-- Ejecuta este script en el SQL Editor de Supabase
-- Añade soporte para programar promociones (horarios y días) por producto

ALTER TABLE "public"."carta_products" 
ADD COLUMN IF NOT EXISTS "promo_schedules" JSONB DEFAULT '[]'::jsonb;

-- Comentario para recordar el formato del JSON
COMMENT ON COLUMN "public"."carta_products"."promo_schedules" IS 'Array de objetos con los horarios de promoción, ej: [{"start": "08:00", "end": "12:00", "days": ["mon", "tue"]}]';
