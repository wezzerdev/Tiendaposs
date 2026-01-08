-- EMERGENCIA: Script de Reparación Total
-- Ejecuta esto para corregir usuarios rotos y permisos de almacenamiento

-- 1. Reparar Usuarios Existentes sin Perfil (Backfill)
-- Si te registraste antes de que el trigger funcionara, tu usuario no tiene perfil ni organización.
do $$
declare
  user_record record;
  new_org_id uuid;
begin
  for user_record in select * from auth.users where id not in (select id from public.profiles)
  loop
    -- Crear Organización para el usuario huérfano
    insert into public.organizations (name, slug, logo_url)
    values (
      coalesce(user_record.raw_user_meta_data->>'full_name', 'Usuario') || '''s Store',
      'org-' || substr(user_record.id::text, 1, 8),
      null
    )
    returning id into new_org_id;

    -- Crear Perfil vinculado
    insert into public.profiles (id, organization_id, full_name, role, avatar_url, is_active)
    values (
      user_record.id,
      new_org_id,
      coalesce(user_record.raw_user_meta_data->>'full_name', 'Usuario'),
      'admin',
      user_record.raw_user_meta_data->>'avatar_url',
      true
    );
    
    raise notice 'Reparado usuario: %', user_record.id;
  end loop;
end;
$$;

-- 2. Asegurar Permisos de Almacenamiento (Storage)
-- Forzar creación del bucket si no existe
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- Eliminar políticas antiguas para empezar de cero
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;
drop policy if exists "Give me access" on storage.objects; -- Política común de debug

-- Crear política "Permitir todo a autenticados" para el bucket products (Solución drástica para dev)
create policy "Allow all authenticated for products"
on storage.objects for all
using ( bucket_id = 'products' and auth.role() = 'authenticated' )
with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- Crear política de lectura pública
create policy "Public read access"
on storage.objects for select
using ( bucket_id = 'products' );

-- 3. Asegurar Permisos de Base de Datos
-- Garantizar que el rol autenticado puede leer sus propios perfiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
    for select using ( auth.uid() = id );

-- Grant explícitos por si acaso
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
