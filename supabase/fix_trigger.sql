-- Corregir Trigger de Registro de Usuarios
-- Problema potencial: Search path o permisos al crear registros automáticos

-- 1. Asegurar extensión
create extension if not exists "uuid-ossp" schema extensions;

-- 2. Función mejorada para manejar nuevo usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
-- Importante: Incluir 'extensions' en el search_path para encontrar uuid_generate_v4()
set search_path = public, extensions
as $$
declare
  v_org_id uuid;
  v_full_name text;
  v_avatar_url text;
begin
  -- Obtener metadatos de forma segura
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Si no hay nombre, usar parte del email
  if v_full_name is null or v_full_name = '' then
    v_full_name := split_part(new.email, '@', 1);
  end if;

  -- 1. Crear Organización
  insert into public.organizations (name, slug, logo_url)
  values (
    v_full_name || '''s Store', -- Ej: "Juan's Store"
    'org-' || substr(new.id::text, 1, 8), -- Slug más corto y único
    null
  )
  returning id into v_org_id;

  -- 2. Crear Perfil
  insert into public.profiles (id, organization_id, full_name, role, avatar_url, is_active)
  values (
    new.id,
    v_org_id,
    v_full_name,
    'admin', -- Rol inicial
    v_avatar_url,
    true
  );

  return new;
exception
  when others then
    -- Registrar error en logs de Supabase (visible en Dashboard > Database > Postgres Logs)
    raise warning 'Error in handle_new_user trigger: %', SQLERRM;
    -- No relanzar error para no bloquear el signup, pero el usuario quedará sin perfil (debe manejarse en app)
    -- O relanzar para que el usuario sepa que falló:
    return null; -- Esto cancela la inserción en auth.users
end;
$$;

-- 3. Recrear el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Asegurar permisos (Grants)
-- Permitir que el rol autenticado y anon lean/inserten si es necesario (aunque el trigger es security definer)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
