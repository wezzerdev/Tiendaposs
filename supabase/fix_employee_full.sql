
-- SOLUCIÓN COMPLETA PARA MÓDULO DE EMPLEADOS
-- Este script corrige permisos, añade columnas faltantes y arregla la eliminación.

-- 1. Asegurar columna PIN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin') THEN
        ALTER TABLE public.profiles ADD COLUMN pin text;
    END IF;
END $$;

-- 2. Corregir Control de Acceso: Empleados desactivados NO deben ver datos
-- Actualizamos la función helper para que devuelva NULL si is_active es false.
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS uuid AS $$
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_active = true
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Corregir Eliminación de Empleados
-- Permitir borrar empleados aunque tengan ventas (dejando la venta huérfana de vendedor pero manteniendo el registro)

-- Eliminar constraint anterior
ALTER TABLE public.sales
DROP CONSTRAINT IF EXISTS sales_profile_id_fkey;

-- Agregar nueva constraint con ON DELETE SET NULL
ALTER TABLE public.sales
ADD CONSTRAINT sales_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Index para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_profile_id ON public.sales(profile_id);

-- 4. Permitir empleados sin usuario Auth (Locales) si aún no está configurado
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
