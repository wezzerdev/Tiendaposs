-- CORRECCIÓN DE EMERGENCIA: RECURSIÓN INFINITA Y STORAGE

-- 1. SOLUCIÓN A LA RECURSIÓN INFINITA EN PROFILES
-- El error "infinite recursion" ocurre porque la política consultaba la tabla 'profiles' 
-- directamente, lo que disparaba la política de nuevo en un bucle infinito.

-- Redefinimos la función auxiliar con SECURITY DEFINER.
-- Esto permite leer el organization_id saltándose las políticas RLS temporalmente.
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Eliminamos las políticas conflictivas
DROP POLICY IF EXISTS "Users can view organization members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own organization" ON public.profiles; -- Por si acaso existía con otro nombre

-- Nueva política limpia y sin recursión
CREATE POLICY "Users can view organization members" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  -- El usuario siempre puede ver su propio perfil
        OR
        organization_id = get_auth_org_id() -- Puede ver a otros de su misma org (usando la función segura)
    );

-- 2. SOLUCIÓN DEFINITIVA A STORAGE (ERROR 400 / RLS)
-- El error "new row violates row-level security policy" en storage suele ser por falta de permisos INSERT/UPDATE.

-- Asegurar bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Limpieza agresiva de políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Public Read Access Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Owner Manage Products" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Products" ON storage.objects;

-- Políticas simplificadas y robustas:

-- A. Lectura Pública: Todo el mundo puede ver las imágenes
CREATE POLICY "Public Read Products" ON storage.objects
    FOR SELECT
    USING ( bucket_id = 'products' );

-- B. Escritura Autenticada: Cualquier usuario logueado puede subir al bucket products
-- Eliminamos restricciones de nombre de archivo o carpeta para evitar errores 400
CREATE POLICY "Authenticated Insert Products" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK ( bucket_id = 'products' );

-- C. Actualización (Necesario para upsert: true)
CREATE POLICY "Authenticated Update Products" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING ( bucket_id = 'products' );

-- D. Borrado
CREATE POLICY "Authenticated Delete Products" ON storage.objects
    FOR DELETE
    TO authenticated
    USING ( bucket_id = 'products' );
