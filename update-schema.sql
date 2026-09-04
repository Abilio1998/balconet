-- Ejecuta este comando en el SQL Editor de Supabase
-- Esto añadirá las columnas de traducción a la tabla de platos (dishes)
-- NO crea ninguna tabla nueva.

alter table "public"."dishes" 
add column if not exists "name_ca" text,
add column if not exists "name_en" text,
add column if not exists "name_fr" text,
add column if not exists "description_ca" text,
add column if not exists "description_en" text,
add column if not exists "description_fr" text;
