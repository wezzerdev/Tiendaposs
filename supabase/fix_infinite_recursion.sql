-- CORRECCIÓN DE ERROR DE RECURSIÓN INFINITA (42P17)
-- Ejecuta este script en el Editor SQL de Supabase para arreglar el error al crear empleados.

-- 1. Crear una función segura para verificar si es admin
-- Usamos SECURITY DEFINER para que esta función se ejecute con permisos elevados
-- y no active las políticas RLS recursivamente al consultar la tabla profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar la política problemática anterior
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;

-- 3. Recrear la política usando la función segura
CREATE POLICY "Admins can create profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  is_admin()
);

-- 4. Opcional: Asegurarse de que los admins puedan ver/editar todo (usando la misma función para evitar recursión en SELECT/UPDATE)
-- Si tienes otras políticas que dan error, puedes reemplazarlas con is_admin() también.
-- Ejemplo (puedes descomentar si tienes problemas al listar):
/*
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id OR is_admin()
);
*/
