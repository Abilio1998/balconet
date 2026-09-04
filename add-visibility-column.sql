-- Añadir columna de visibilidad a las categorías de la carta
ALTER TABLE carta_categories ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
