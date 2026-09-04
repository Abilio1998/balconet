-- Add session-specific pdf_layout columns to carta_categories to allow explicit PDF styling
-- Values: 'classic' (default), 'primary' (featured/gold), 'secondary' (two-columns), 'dessert' (centered)

ALTER TABLE carta_categories ADD COLUMN IF NOT EXISTS pdf_layout_lunch VARCHAR(50) DEFAULT 'classic';
ALTER TABLE carta_categories ADD COLUMN IF NOT EXISTS pdf_layout_dinner VARCHAR(50) DEFAULT 'classic';

-- Existing featured categories
UPDATE carta_categories SET pdf_layout_lunch = 'primary', pdf_layout_dinner = 'primary' WHERE name ILIKE '%comenzar%' OR name ILIKE '%sugerencia%';

-- Existing secondary categories
UPDATE carta_categories SET pdf_layout_lunch = 'secondary', pdf_layout_dinner = 'secondary' WHERE name ILIKE '%bocadillo%' OR name ILIKE '%hamburguesa%' OR name ILIKE '%tapas%';

-- Existing dessert categories
UPDATE carta_categories SET pdf_layout_lunch = 'dessert', pdf_layout_dinner = 'dessert' WHERE name ILIKE '%postre%';
