-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- 1. Tabla de Organizaciones (Tenant)
create table if not exists public.organizations (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    slug text unique not null,
    logo_url text,
    address text,
    phone text,
    website text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Perfiles (Empleados/Usuarios del sistema)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    organization_id uuid references public.organizations(id),
    full_name text,
    role text check (role in ('admin', 'manager', 'seller', 'inventory')) default 'seller',
    is_active boolean default true,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Clientes (CRM + E-commerce)
create table if not exists public.customers (
    id uuid default uuid_generate_v4() primary key,
    organization_id uuid references public.organizations(id) not null,
    name text not null,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Productos
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    organization_id uuid references public.organizations(id) not null,
    name text not null,
    description text,
    sku text,
    barcode text,
    price decimal(10,2) not null default 0,
    cost decimal(10,2) not null default 0,
    category text,
    image_url text,
    manage_stock boolean default true,
    stock integer default 0,
    min_stock_alert integer default 5,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabla de Ventas (Cabecera)
create table if not exists public.sales (
    id uuid default uuid_generate_v4() primary key,
    organization_id uuid references public.organizations(id) not null,
    customer_id uuid references public.customers(id),
    profile_id uuid references public.profiles(id), -- Vendedor
    total decimal(10,2) not null default 0,
    status text check (status in ('completed', 'pending', 'cancelled')) default 'completed',
    payment_method text default 'cash',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Detalle de Ventas
create table if not exists public.sale_items (
    id uuid default uuid_generate_v4() primary key,
    sale_id uuid references public.sales(id) on delete cascade not null,
    product_id uuid references public.products(id),
    product_name text not null, -- Guardar nombre histórico
    quantity integer not null default 1,
    unit_price decimal(10,2) not null,
    total_price decimal(10,2) not null
);

-- 7. Configuración de Tienda Online
create table if not exists public.store_configs (
    organization_id uuid references public.organizations(id) primary key,
    is_active boolean default false,
    subdomain text unique,
    banner_text text,
    primary_color text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.store_configs enable row level security;

-- Políticas de Seguridad (Policies)
-- Función auxiliar para obtener el org_id del usuario actual
create or replace function get_auth_org_id()
returns uuid as $$
    select organization_id from public.profiles where id = auth.uid()
$$ language sql security definer;

-- Organizations: Usuarios pueden ver su propia organización
drop policy if exists "Users can view own organization" on public.organizations;
create policy "Users can view own organization" on public.organizations
    for select using (id = get_auth_org_id());

-- Profiles: Usuarios pueden ver perfiles de su misma organización
drop policy if exists "Users can view organization members" on public.profiles;
create policy "Users can view organization members" on public.profiles
    for select using (organization_id = get_auth_org_id());

-- Products: CRUD completo para miembros de la organización
drop policy if exists "Organization members can manage products" on public.products;
create policy "Organization members can manage products" on public.products
    for all using (organization_id = get_auth_org_id());

-- Customers: CRUD completo
drop policy if exists "Organization members can manage customers" on public.customers;
create policy "Organization members can manage customers" on public.customers
    for all using (organization_id = get_auth_org_id());

-- Sales: CRUD completo
drop policy if exists "Organization members can manage sales" on public.sales;
create policy "Organization members can manage sales" on public.sales
    for all using (organization_id = get_auth_org_id());

-- Sale Items: Acceso a través de la venta padre
drop policy if exists "Organization members can manage sale items" on public.sale_items;
create policy "Organization members can manage sale items" on public.sale_items
    for all using (
        exists (
            select 1 from public.sales
            where sales.id = sale_items.sale_id
            and sales.organization_id = get_auth_org_id()
        )
    );

-- Store Config: Gestión propia
drop policy if exists "Organization members can manage store config" on public.store_configs;
create policy "Organization members can manage store config" on public.store_configs
    for all using (organization_id = get_auth_org_id());

-- Política Pública para Tienda Online (Lectura de Productos)
-- Permitir lectura pública de productos si la tienda está activa (simplificado)
drop policy if exists "Public read access for active stores" on public.products;
create policy "Public read access for active stores" on public.products
    for select using (true); -- Simplificado para demo, idealmente verificaría store_configs.is_active
