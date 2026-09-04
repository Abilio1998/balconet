-- El Balconet Bar-Restaurant – Supabase SQL Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- DAILY MENUS
-- ============================================================
create table if not exists daily_menus (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  price       numeric(5,2) not null default 14.00,
  published   boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- DISHES  (linked to daily_menus)
-- ============================================================
create table if not exists dishes (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid not null references daily_menus(id) on delete cascade,
  name        text not null check (char_length(name) <= 200),
  description text check (char_length(description) <= 500),
  course      text not null check (course in ('first', 'second', 'dessert')),
  order_index integer not null default 0,
  likes_count integer default 0,
  created_at  timestamptz default now()
);

create index if not exists dishes_menu_id_idx on dishes(menu_id);

-- ============================================================
-- CARTA IMAGES
-- ============================================================
create table if not exists carta_images (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  alt         text not null default 'Imagen El Balconet',
  order_index integer not null default 0,
  created_at  timestamptz default now()
);

-- ============================================================
-- HERO IMAGES
-- ============================================================
create table if not exists hero_images (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  alt         text not null default 'El Balconet hero',
  order_index integer not null default 0,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- daily_menus: public can SELECT published, service role can do all
alter table daily_menus enable row level security;
create policy "Public read published menus"
  on daily_menus for select
  using (published = true);

-- dishes: public can SELECT dishes from published menus
alter table dishes enable row level security;
create policy "Public read dishes from published menus"
  on dishes for select
  using (
    exists (
      select 1 from daily_menus m
      where m.id = dishes.menu_id and m.published = true
    )
  );

-- carta_images: public can SELECT
alter table carta_images enable row level security;
create policy "Public read carta images"
  on carta_images for select
  using (true);

-- hero_images: public can SELECT
alter table hero_images enable row level security;
create policy "Public read hero images"
  on hero_images for select
  using (true);

-- ============================================================
-- HELPER: updated_at trigger for daily_menus
-- ============================================================
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on daily_menus
  for each row
  execute function update_updated_at_column();
