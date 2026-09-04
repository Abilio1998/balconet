-- Add disable_web_reservations column to reservation_settings table
ALTER TABLE reservation_settings 
ADD COLUMN IF NOT EXISTS disable_web_reservations BOOLEAN DEFAULT false;
