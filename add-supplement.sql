-- Ejecuta esto en el SQL Editor de Supabase
-- Añade la columna de precio extra (suplemento) a la tabla existente 'dishes'

alter table "public"."dishes" 
add column if not exists "supplement" numeric(5,2) default 0.00;
