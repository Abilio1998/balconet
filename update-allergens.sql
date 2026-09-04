-- Run this in your Supabase SQL Editor to add allergens to dishes
ALTER TABLE dishes ADD COLUMN allergens text[] DEFAULT '{}';
