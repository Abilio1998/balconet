-- Update reservation_settings to include breakfast session
ALTER TABLE public.reservation_settings
ADD COLUMN IF NOT EXISTS breakfast_start TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS breakfast_end TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS breakfast_menu_active BOOLEAN DEFAULT true;

-- Update carta_products to include breakfast flag
ALTER TABLE public.carta_products
ADD COLUMN IF NOT EXISTS show_in_breakfast BOOLEAN DEFAULT false;

-- Add lunch and dinner active flags if they don't exist (they were being used in the code)
ALTER TABLE public.reservation_settings
ADD COLUMN IF NOT EXISTS lunch_menu_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dinner_menu_active BOOLEAN DEFAULT true;
