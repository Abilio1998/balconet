-- ================================================================
-- El Balconet — Inserción de Carta (Categorías y Platos)
-- Ejecutar en: Supabase SQL Editor
-- IMPORTANTE: Este script NO borra datos existentes.
-- Usa ON CONFLICT DO NOTHING para evitar duplicados en categorías.
-- ================================================================

-- ================================================================
-- 1. CATEGORÍAS
-- ================================================================

INSERT INTO public.carta_categories (id, name, order_index, is_visible) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Para compartir', 1, true),
  ('a1000000-0000-0000-0000-000000000002', 'Nuestras Croquetas te harán sonreír', 2, true),
  ('a1000000-0000-0000-0000-000000000003', 'Los Clásicos de la Casa', 3, true),
  ('a1000000-0000-0000-0000-000000000004', 'Hamburguesas de Black Angus', 4, true),
  ('a1000000-0000-0000-0000-000000000005', 'Para acabar con un toque dulce...', 5, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, order_index = EXCLUDED.order_index;

-- ================================================================
-- 2. PRODUCTOS — Para compartir
-- ================================================================

INSERT INTO public.carta_products (category_id, name, price, order_index, is_visible) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Tomate de Can Puixic con Aceite de Oliva Virgen y Kalamata', 13.90, 1, true),
  ('a1000000-0000-0000-0000-000000000001', 'Burrata Royal con Pesto y Pan de Cristal', 12.50, 2, true),
  ('a1000000-0000-0000-0000-000000000001', 'Boquerones 0.0 del Cantábrico', 13.00, 3, true),
  ('a1000000-0000-0000-0000-000000000001', 'Anchoas 0.0 del Cantábrico', 13.00, 4, true),
  ('a1000000-0000-0000-0000-000000000001', 'Tabla de Jamón Ibérico 100% Bellota con Pan de Cristal, Tomate y Aceite de ADOVE', 23.90, 5, true),
  ('a1000000-0000-0000-0000-000000000001', 'Tabla de Quesos con Fruta de Temporada y Tostaditas', 18.90, 6, true),
  ('a1000000-0000-0000-0000-000000000001', 'Hummus Cremoso de Garbanzos con Crudités y Pan de Pita a la Brasa', 9.00, 7, true),
  ('a1000000-0000-0000-0000-000000000001', 'Nuestras Bravas con Salsa Chipotle, Alioli y Aceite', 6.90, 8, true),
  ('a1000000-0000-0000-0000-000000000001', 'Ración de Patatas Fritas', 4.90, 9, true),
  ('a1000000-0000-0000-0000-000000000001', 'Ración de Boniato Frito', 4.90, 10, true),
  ('a1000000-0000-0000-0000-000000000001', 'Huevos Rotos con Jamón Ibérico y Pimentón Ahumado', 12.90, 11, true),
  ('a1000000-0000-0000-0000-000000000001', 'Torreznos de Soria con Guacamole y Cebolla Encurtida', 11.90, 12, true),
  ('a1000000-0000-0000-0000-000000000001', 'Fingers de Pollo al Estilo KFC', 9.90, 13, true),
  ('a1000000-0000-0000-0000-000000000001', 'Cazuelita de Langostinos al Ajillo', 12.90, 14, true),
  ('a1000000-0000-0000-0000-000000000001', 'Calamares a la Andaluza con Mayonesa Cítrica', 14.90, 15, true);

-- ================================================================
-- 3. PRODUCTOS — Croquetas
-- ================================================================

INSERT INTO public.carta_products (category_id, name, price, order_index, is_visible) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Croqueta de Boletus y Trufa (unidad)', 1.90, 1, true),
  ('a1000000-0000-0000-0000-000000000002', 'Croqueta de Queso y Cebolla Caramelizada (unidad)', 1.90, 2, true),
  ('a1000000-0000-0000-0000-000000000002', 'Croqueta de Jamón Ibérico (unidad)', 1.90, 3, true),
  ('a1000000-0000-0000-0000-000000000002', 'Croqueta de Pollo Asado (unidad)', 1.90, 4, true),
  ('a1000000-0000-0000-0000-000000000002', 'Croqueta de Pulpo a la Gallega (unidad)', 1.90, 5, true);

-- ================================================================
-- 4. PRODUCTOS — Los Clásicos de la Casa
-- ================================================================

INSERT INTO public.carta_products (category_id, name, price, order_index, is_visible) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Jamón Ibérico con Pan de Coca con Tomate y ADOVE', 13.90, 1, true),
  ('a1000000-0000-0000-0000-000000000003', 'Ibérico Fusión - Lomo a la Brasa con Queso Cheddar Fundido de Dijon', 9.90, 2, true),
  ('a1000000-0000-0000-0000-000000000003', 'El Cruixent de Bacó i Formatge Brie Fos amb Mel i Romaní', 9.90, 3, true);

-- ================================================================
-- 5. PRODUCTOS — Hamburguesas de Black Angus
-- ================================================================

INSERT INTO public.carta_products (category_id, name, description, price, order_index, is_visible) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'La de Toda la Vida', 'Lechuga, tomate y queso', 14.90, 1, true),
  ('a1000000-0000-0000-0000-000000000004', 'La Balconet', 'Cebolla caramelizada, cheddar y salsa Balconet', 14.90, 2, true),
  ('a1000000-0000-0000-0000-000000000004', 'La Premium', 'Queso Idiazabal, foie micuit y encurtidos', 16.90, 3, true),
  ('a1000000-0000-0000-0000-000000000004', 'La Vegana', 'Lechuga, tomate, aguacate y romesco', 14.90, 4, true);

-- ================================================================
-- 6. PRODUCTOS — Postres
-- ================================================================

INSERT INTO public.carta_products (category_id, name, price, order_index, is_visible) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'Xuixo XL de Mantequilla Relleno de Crema con Helado de Canela', 6.90, 1, true),
  ('a1000000-0000-0000-0000-000000000005', 'Coulant de Chocolate con Helado de Vainilla de Madagascar', 6.90, 2, true),
  ('a1000000-0000-0000-0000-000000000005', 'Cheesecake con Coulis de Frutos Rojos', 6.90, 3, true),
  ('a1000000-0000-0000-0000-000000000005', 'Tatín de Manzana Caramelizada con Helado de Leche Merengada', 6.90, 4, true);

-- ================================================================
-- FIN — Carta de El Balconet insertada 🎉
-- ================================================================
