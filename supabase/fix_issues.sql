-- 1. CORRECCIÓN DE POLÍTICAS DE PERFILES (Evitar recursión y permitir acceso propio)
-- Eliminamos la política anterior que podría causar bucles infinitos o bloqueos
DROP POLICY IF EXISTS "Users can view organization members" ON public.profiles;

-- Nueva política: Permite ver tu propio perfil SIEMPRE, y los de tu organización
CREATE POLICY "Users can view organization members" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id -- Acceso garantizado al propio perfil
        OR
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Aseguramos que los usuarios puedan crear su perfil si no existe (al registrarse)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Aseguramos que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 2. CORRECCIÓN DE ALMACENAMIENTO (STORAGE)
-- Asegurar que el bucket 'products' existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Limpiar políticas antiguas de storage para evitar conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Política 1: Lectura pública para imágenes de productos
CREATE POLICY "Public Read Access Products" ON storage.objects
    FOR SELECT
    USING ( bucket_id = 'products' );

-- Política 2: Subida permitida para usuarios autenticados
-- Simplificamos la restricción de carpetas para evitar errores 400 por rutas
CREATE POLICY "Authenticated Upload Products" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'products' 
        AND auth.role() = 'authenticated'
    );

-- Política 3: Modificación/Borrado para el propietario del objeto (quien lo subió)
CREATE POLICY "Owner Manage Products" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'products' 
        AND auth.uid() = owner
    );

CREATE POLICY "Owner Delete Products" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'products' 
        AND auth.uid() = owner
    );

-- 3. VALIDACIÓN DE ORGANIZACIONES
-- Aseguramos que la función helper sea robusta
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS uuid AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
