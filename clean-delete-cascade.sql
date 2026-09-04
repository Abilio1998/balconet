-- Ejecuta esto en el SQL Editor de Supabase
-- Esto asegura que todos los platos (y sus traducciones) se eliminen automáticamente
-- de forma permanente de la tabla 'dishes' cuando elimines un 'daily_menus'.
-- (Cascada automática para mantener la base de datos 100% limpia)

ALTER TABLE "public"."dishes"
DROP CONSTRAINT IF EXISTS dishes_menu_id_fkey;

ALTER TABLE "public"."dishes"
ADD CONSTRAINT dishes_menu_id_fkey
  FOREIGN KEY (menu_id)
  REFERENCES daily_menus(id)
  ON DELETE CASCADE;
