-- El Balconet Bar-Restaurant – Dynamic Carta Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- CARTA CATEGORIES
-- ============================================================
create table if not exists carta_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_ca     text,
  name_en     text,
  name_fr     text,
  order_index integer not null default 0,
  created_at  timestamptz default now()
);

-- ============================================================
-- CARTA PRODUCTS
-- ============================================================
create table if not exists carta_products (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references carta_categories(id) on delete cascade,
  name           text not null,
  name_ca        text,
  name_en        text,
  name_fr        text,
  description    text,
  description_ca text,
  description_en text,
  description_fr text,
  price          numeric(5,2),
  price_exterior numeric(5,2),
  allergens      text[] default '{}',
  is_web_featured boolean default false,
  likes_count    integer default 0,
  order_index    integer not null default 0,
  created_at     timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table "public"."carta_categories" enable row level security;
alter table "public"."carta_products" enable row level security;

-- Public can select everything to view the menu
create policy "Public read carta categories" on "public"."carta_categories" for select using (true);
create policy "Public read carta products" on "public"."carta_products" for select using (true);
