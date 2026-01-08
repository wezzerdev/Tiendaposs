-- REPARACIÓN COMPLETA DE PERMISOS (Insert, Update, Delete)
-- Ejecuta este script en el Editor SQL de Supabase para arreglar todos los problemas de gestión de empleados.

-- 1. Asegurar función segura para verificar admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Verifica si el usuario actual tiene rol 'admin' en la tabla profiles
  -- Usamos SECURITY DEFINER para evitar recursión infinita
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpiar políticas antiguas que pueden causar conflictos
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Organization members can update organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. Crear Política de INSERT (Crear Empleados)
CREATE POLICY "Admins can create profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  is_admin()
);

-- 4. Crear Política de UPDATE (Desactivar/Editar Empleados)
-- Permite editar si eres admin y el perfil destino está en tu misma organización
CREATE POLICY "Admins can update organization profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  is_admin() AND (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- 5. Crear Política de DELETE (Eliminar Empleados)
-- Permite borrar si eres admin y el perfil destino está en tu misma organización
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
  is_admin() AND (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- 6. Política de SELECT (Ver Empleados)
-- Asegurar que todos puedan ver los perfiles de su organización
DROP POLICY IF EXISTS "Users can view own organization profiles" ON public.profiles;
CREATE POLICY "Users can view own organization profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
