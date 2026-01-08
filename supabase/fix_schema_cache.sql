-- CORRECCIÓN DEL SCHEMA CACHE (PGRST204) Y ERROR DE SESIÓN

-- 1. Refrescar el caché del esquema de PostgREST
-- A veces PostgREST no detecta cambios en las tablas (como la columna stock).
-- Forzamos un reload notificando al canal pgrst.
NOTIFY pgrst, 'reload config';

-- 2. Asegurar que la columna 'stock' existe en 'products'
-- Si por alguna razón la migración inicial falló, esto lo arregla de forma idempotente.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE public.products ADD COLUMN stock integer DEFAULT 0;
    END IF;
END $$;

-- 3. Trigger para manejar usuarios nuevos (REFORZADO)
-- Aseguramos que se ejecute con permisos de superusuario (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Verificar si ya existe perfil para evitar duplicados
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    RETURN new;
  END IF;

  -- Crear Organización por defecto
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'organization_name', 'Mi Tienda'),
    'tienda-' || substring(new.id::text from 1 for 8), -- Slug único básico
    new.id
  )
  RETURNING id INTO org_id;

  -- Crear Perfil
  INSERT INTO public.profiles (id, organization_id, full_name, role)
  VALUES (
    new.id,
    org_id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'admin'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reparar usuarios actuales SIN perfil (Script de una sola vez)
-- Esto arregla el error "No active session" o "No organization found" para tu usuario actual
DO $$
DECLARE
  user_rec record;
  new_org_id uuid;
BEGIN
  FOR user_rec IN SELECT * FROM auth.users LOOP
    -- Si el usuario no tiene perfil en public.profiles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_rec.id) THEN
      
      -- Crear Org
      INSERT INTO public.organizations (name, slug, owner_id)
      VALUES (
        'Tienda de ' || split_part(user_rec.email, '@', 1), 
        'tienda-' || substring(user_rec.id::text from 1 for 8), 
        user_rec.id
      )
      RETURNING id INTO new_org_id;

      -- Crear Perfil
      INSERT INTO public.profiles (id, organization_id, full_name, role)
      VALUES (user_rec.id, new_org_id, user_rec.email, 'admin');
      
      RAISE NOTICE 'Reparado usuario: %', user_rec.email;
    END IF;
  END LOOP;
END $$;
