-- SCRIPT DE REPARACIÓN TOTAL: STORAGE, PERFILES Y TRIGGERS
-- Ejecuta esto en el Editor SQL de Supabase para corregir todos los problemas de backend.

-- 1. LIMPIEZA Y CONFIGURACIÓN DE STORAGE (Igual que antes pero asegurando todo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar TODAS las políticas previas del bucket products para empezar de cero
DROP POLICY IF EXISTS "Public Read Access Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Owner Manage Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Products" ON storage.objects;

-- Políticas permisivas para funcionamiento correcto
CREATE POLICY "Public Read Products" ON storage.objects FOR SELECT USING ( bucket_id = 'products' );

CREATE POLICY "Authenticated Insert Products" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'products' );

CREATE POLICY "Authenticated Update Products" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'products' );

CREATE POLICY "Authenticated Delete Products" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'products' );


-- 2. FUNCIÓN SEGURA PARA OBTENER ORG_ID (Evita recursión)
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- 3. POLÍTICAS DE PERFILES (Corrección de recursión)
DROP POLICY IF EXISTS "Users can view organization members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view organization members" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  
        OR
        organization_id = get_auth_org_id()
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);


-- 4. TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL Y ORGANIZACIÓN
-- Esto asegura que todo usuario nuevo tenga datos válidos automáticamente.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_id uuid;
BEGIN
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

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. REPARACIÓN DE USUARIOS HUÉRFANOS (Usuarios existentes sin perfil)
DO $$
DECLARE
  user_rec record;
  org_id uuid;
BEGIN
  FOR user_rec IN SELECT * FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_rec.id) THEN
      
      -- Crear Org para el usuario huérfano
      INSERT INTO public.organizations (name, slug, owner_id)
      VALUES ('Tienda de ' || user_rec.email, 'tienda-' || substring(user_rec.id::text from 1 for 8), user_rec.id)
      RETURNING id INTO org_id;

      -- Crear Perfil
      INSERT INTO public.profiles (id, organization_id, full_name, role)
      VALUES (user_rec.id, org_id, user_rec.email, 'admin');
      
    END IF;
  END LOOP;
END $$;
