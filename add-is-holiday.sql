-- Run this in your Supabase SQL Editor
-- This adds the new column to allow weekdays to use the weekend design

ALTER TABLE daily_menus ADD COLUMN IF NOT EXISTS is_holiday boolean not null default false;
