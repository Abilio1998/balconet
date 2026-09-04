-- Ejecuta esto en el SQL Editor de Supabase
-- Añade la columna de precio exterior (terraza) a la tabla existente 'daily_menus'

alter table "public"."daily_menus" 
add column if not exists "price_exterior" numeric(5,2);
