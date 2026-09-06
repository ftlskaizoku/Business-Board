-- Business Board — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query) once,
-- against a fresh project. Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, created on signup
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are self-readable" on profiles
  for select using (auth.uid() = id);
create policy "profiles are self-insertable" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles are self-updatable" on profiles
  for update using (auth.uid() = id);

-- automatically create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  niche text not null check (niche in ('restaurant','boutique','salon','prestataire','ecommerce')),
  type text not null check (type in ('products','services','both')),
  currency text not null default 'FCFA',
  created_at timestamptz not null default now()
);

alter table businesses enable row level security;

create policy "owner reads own businesses" on businesses
  for select using (auth.uid() = owner_id);
create policy "owner inserts own businesses" on businesses
  for insert with check (auth.uid() = owner_id);
create policy "owner updates own businesses" on businesses
  for update using (auth.uid() = owner_id);
create policy "owner deletes own businesses" on businesses
  for delete using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- helper: is this business owned by the current user?
-- (used by every child table's RLS policy below)
-- ---------------------------------------------------------------------------
create or replace function public.owns_business(biz_id uuid)
returns boolean as $$
  select exists (
    select 1 from businesses where id = biz_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text not null default 'Autre',
  price numeric not null default 0,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);
alter table products enable row level security;
create policy "owner manages products" on products
  for all using (owns_business(business_id)) with check (owns_business(business_id));

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text not null default 'Autre',
  duration text not null default '—',
  price numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table services enable row level security;
create policy "owner manages services" on services
  for all using (owns_business(business_id)) with check (owns_business(business_id));

-- ---------------------------------------------------------------------------
-- sales + sale_items (a sale is one transaction, made of one or more line items)
-- ---------------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  sale_date date not null default current_date,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table sales enable row level security;
create policy "owner manages sales" on sales
  for all using (owns_business(business_id)) with check (owns_business(business_id));

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  name text not null,
  qty integer not null default 1,
  price numeric not null default 0
);
alter table sale_items enable row level security;
create policy "owner manages sale_items" on sale_items
  for all using (
    exists (select 1 from sales where sales.id = sale_id and owns_business(sales.business_id))
  ) with check (
    exists (select 1 from sales where sales.id = sale_id and owns_business(sales.business_id))
  );

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  expense_date date not null default current_date,
  category text not null default 'Autre',
  amount numeric not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);
alter table expenses enable row level security;
create policy "owner manages expenses" on expenses
  for all using (owns_business(business_id)) with check (owns_business(business_id));

-- ---------------------------------------------------------------------------
-- appointment_slots (for niches with hasServices)
-- ---------------------------------------------------------------------------
create table if not exists appointment_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  slot_date date not null default current_date,
  slot_time text not null,
  status text not null default 'free' check (status in ('free','taken')),
  client text,
  service_name text,
  created_at timestamptz not null default now()
);
alter table appointment_slots enable row level security;
create policy "owner manages slots" on appointment_slots
  for all using (owns_business(business_id)) with check (owns_business(business_id));

-- ---------------------------------------------------------------------------
-- customers (a business's own clientele, distinct from app users)
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text,
  total_spend numeric not null default 0,
  visits integer not null default 0,
  created_at timestamptz not null default now()
);
alter table customers enable row level security;
create policy "owner manages customers" on customers
  for all using (owns_business(business_id)) with check (owns_business(business_id));

-- ---------------------------------------------------------------------------
-- indexes for the queries the app actually runs
-- ---------------------------------------------------------------------------
create index if not exists idx_businesses_owner on businesses(owner_id);
create index if not exists idx_products_business on products(business_id);
create index if not exists idx_services_business on services(business_id);
create index if not exists idx_sales_business_date on sales(business_id, sale_date);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_expenses_business_date on expenses(business_id, expense_date);
create index if not exists idx_slots_business_date on appointment_slots(business_id, slot_date);
create index if not exists idx_customers_business on customers(business_id);
