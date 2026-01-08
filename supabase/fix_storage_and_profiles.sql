-- Corregir y completar Políticas de Almacenamiento (Storage)
-- Problema: "new row violates row-level security policy" al subir imagen

-- 1. Asegurar que el bucket existe y es público
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- 2. Limpiar políticas antiguas para evitar conflictos
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;

-- 3. Crear Políticas permisivas para usuarios autenticados
-- Lectura pública (Cualquiera puede ver las imágenes de productos)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- Inserción (Upload): Cualquier usuario autenticado puede subir al bucket 'products'
-- Nota: En producción estricta, validaríamos que el usuario pertenezca a la organización,
-- pero storage.objects no tiene link directo a 'organizations' fácil de chequear sin metadatos custom.
-- Para MVP, 'authenticated' es suficiente.
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( 
    bucket_id = 'products' 
    and auth.role() = 'authenticated' 
  );

-- Actualización
create policy "Authenticated users can update"
  on storage.objects for update
  using ( 
    bucket_id = 'products' 
    and auth.role() = 'authenticated' 
  );

-- Eliminación
create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( 
    bucket_id = 'products' 
    and auth.role() = 'authenticated' 
  );

-- 4. Corregir política de Perfiles (Profiles)
-- Problema: GET profiles 406 Not Acceptable (probablemente por headers o RLS restrictivo que retorna vacío)
-- Asegurar que el usuario pueda leer su propio perfil para obtener organization_id
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
    for select using ( auth.uid() = id );

-- Asegurar que la función get_auth_org_id() sea robusta
create or replace function get_auth_org_id()
returns uuid as $$
    select organization_id from public.profiles where id = auth.uid()
$$ language sql security definer;
