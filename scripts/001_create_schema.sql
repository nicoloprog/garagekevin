-- IronWorks Auto: Database Schema
-- Tables: profiles, vehicles, services, bookings, products, orders, order_items

-- Enums
create type public.user_role as enum ('ADMIN', 'CUSTOMER');
create type public.booking_status as enum ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
create type public.order_status as enum ('PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role public.user_role not null default 'CUSTOMER',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Anyone can view profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'CUSTOMER')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Vehicles
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null,
  vin text,
  created_at timestamptz not null default now()
);

create index idx_vehicles_user on public.vehicles(user_id);
alter table public.vehicles enable row level security;
create policy "Users can view own vehicles" on public.vehicles for select using (auth.uid() = user_id);
create policy "Users can insert own vehicles" on public.vehicles for insert with check (auth.uid() = user_id);
create policy "Users can update own vehicles" on public.vehicles for update using (auth.uid() = user_id);
create policy "Users can delete own vehicles" on public.vehicles for delete using (auth.uid() = user_id);
-- Admin can see all vehicles
create policy "Admins can view all vehicles" on public.vehicles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Services (public read, admin write)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  base_price numeric(10,2) not null,
  duration_minutes integer not null,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;
create policy "Anyone can view services" on public.services for select using (true);
create policy "Admins can insert services" on public.services for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can update services" on public.services for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can delete services" on public.services for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  scheduled_at timestamptz not null,
  status public.booking_status not null default 'PENDING',
  notes text,
  created_at timestamptz not null default now()
);

create index idx_bookings_user on public.bookings(user_id);
create index idx_bookings_status on public.bookings(status);
alter table public.bookings enable row level security;
create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can insert own bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Admins can view all bookings" on public.bookings for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can update any booking" on public.bookings for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Products (public read, admin write)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null,
  stock integer not null default 0,
  category text not null default 'Other',
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category on public.products(category);
alter table public.products enable row level security;
create policy "Anyone can view products" on public.products for select using (true);
create policy "Admins can insert products" on public.products for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can update products" on public.products for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can delete products" on public.products for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total numeric(10,2) not null default 0,
  status public.order_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins can view all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Admins can update any order" on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  price numeric(10,2) not null
);

create index idx_order_items_order on public.order_items(order_id);
alter table public.order_items enable row level security;
create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Users can insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Admins can view all order items" on public.order_items for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
