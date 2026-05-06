-- ============================================================================
-- Bhadhara Transport Management System — Supabase Schema
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. PROFILES (extends auth.users with role info)
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  role text not null default 'client' check (role in ('admin', 'client')),
  email text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone can read profiles (needed for messaging usernames)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Admins can update any profile
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. TRUCKS
-- ============================================================================
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  driver_name text,
  status text not null default 'inactive' check (status in ('active', 'maintenance', 'inactive')),
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trucks enable row level security;

-- Everyone authenticated can read trucks
create policy "Trucks are viewable by authenticated users"
  on public.trucks for select
  to authenticated
  using (true);

-- Only admins can insert/update/delete trucks
create policy "Admins can insert trucks"
  on public.trucks for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update trucks"
  on public.trucks for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete trucks"
  on public.trucks for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. EMPLOYEES
-- ============================================================================
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('driver', 'mechanic', 'admin', 'worker')),
  salary numeric not null default 0,
  default_salary numeric not null default 0,
  join_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  promotions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "Admins can do everything with employees"
  on public.employees for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. DAILY RECORDS
-- ============================================================================
create table public.daily_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  loads jsonb not null default '[]'::jsonb,
  expenses jsonb not null default '{}'::jsonb,
  gross_revenue numeric not null default 0,
  total_expenses numeric not null default 0,
  net_revenue numeric not null default 0,
  saved_at timestamptz not null default now(),
  saved_by text not null default ''
);

alter table public.daily_records enable row level security;

create policy "Admins can do everything with daily_records"
  on public.daily_records for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5. MESSAGES
-- ============================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user text not null,
  to_user text not null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Users can read messages they sent or received
create policy "Users can read own messages"
  on public.messages for select
  to authenticated
  using (
    from_user = (
      select username from public.profiles where id = auth.uid()
    )
    or to_user = (
      select username from public.profiles where id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Users can send messages
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (
    from_user = (
      select username from public.profiles where id = auth.uid()
    )
  );

-- Users can mark their received messages as read
create policy "Users can update own received messages"
  on public.messages for update
  to authenticated
  using (
    to_user = (
      select username from public.profiles where id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;

-- 6. BOOKINGS
-- ============================================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users on delete set null,
  client_username text not null,
  client_name text not null default '',
  load_type text not null,
  load_type_label text not null default '',
  number_of_loads integer not null default 1,
  preferred_date date not null,
  delivery_address text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  estimated_delivery text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Clients can read their own bookings
create policy "Clients can read own bookings"
  on public.bookings for select
  to authenticated
  using (
    client_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Clients can create bookings
create policy "Clients can create bookings"
  on public.bookings for insert
  to authenticated
  with check (client_id = auth.uid());

-- Admins can update any booking (status changes)
create policy "Admins can update bookings"
  on public.bookings for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Clients can update own pending bookings
create policy "Clients can update own pending bookings"
  on public.bookings for update
  to authenticated
  using (
    client_id = auth.uid() and status = 'pending'
  );

-- Enable realtime for bookings
alter publication supabase_realtime add table public.bookings;

-- 7. SETTINGS (key-value store for app config)
-- ============================================================================
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- Everyone can read settings
create policy "Settings are viewable by authenticated users"
  on public.settings for select
  to authenticated
  using (true);

-- Only admins can modify settings
create policy "Admins can modify settings"
  on public.settings for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Seed default settings
insert into public.settings (key, value) values
  ('default_expenses', '{"workersFeePerLoad": 20, "riversandFeePerLoad": 5}'::jsonb),
  ('load_prices', '{"riversand": 90, "pitsand": 85, "quarrystone": 85, "gravel": 90, "other": 0}'::jsonb);

-- 8. FILES (metadata for uploaded files)
-- ============================================================================
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  bucket text not null,
  path text not null,
  filename text not null,
  size_bytes bigint,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

alter table public.files enable row level security;

-- Users can see their own files, admins can see all
create policy "Users can read own files"
  on public.files for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can upload files"
  on public.files for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own files"
  on public.files for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================================
-- SEED DATA: Default trucks and employees
-- ============================================================================
insert into public.trucks (plate, driver_name, status) values
  ('AFR4994', 'Gombe', 'active'),
  ('AFR2583', 'Tanya', 'active'),
  ('AFN8131', 'Tinashe', 'active'),
  ('UNASSIGNED', 'Fidza', 'active'),
  ('TRK-005', null, 'inactive'),
  ('TRK-006', null, 'inactive'),
  ('TRK-007', null, 'inactive');

insert into public.employees (name, role, salary, default_salary, join_date, status) values
  ('Gombe', 'driver', 300, 300, '2022-01-01', 'active'),
  ('Tanya', 'driver', 300, 300, '2022-01-01', 'active'),
  ('Tinashe', 'driver', 300, 300, '2022-01-01', 'active'),
  ('Fidza', 'driver', 300, 300, '2022-01-01', 'active');

-- ============================================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage)
-- ============================================================================
-- Create these buckets manually in the Supabase dashboard:
-- 1. 'receipts' — for delivery receipts
-- 2. 'documents' — for invoices, contracts
-- 3. 'vehicle-photos' — for truck/fleet photos
