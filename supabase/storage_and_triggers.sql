-- 1. Crear Bucket de Almacenamiento para Productos
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Políticas de Storage
-- Permitir acceso público de lectura
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- Permitir subida solo a usuarios autenticados
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- Permitir actualización/borrado a usuarios autenticados (dueños de la org)
create policy "Authenticated users can update"
  on storage.objects for update
  using ( bucket_id = 'products' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- 2. Trigger para crear Perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- 1. Crear una organización por defecto para el usuario
  insert into public.organizations (name, slug, logo_url)
  values (
    'Mi Organización', 
    'org-' || new.id, -- Slug temporal único
    null
  )
  returning id into v_org_id;

  -- 2. Crear el perfil vinculado
  insert into public.profiles (id, organization_id, full_name, role, avatar_url)
  values (
    new.id,
    v_org_id,
    new.raw_user_meta_data->>'full_name',
    'admin', -- El primer usuario es admin
    new.raw_user_meta_data->>'avatar_url'
  );

  return new;
end;
$$;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
