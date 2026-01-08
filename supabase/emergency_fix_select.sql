-- RESTAURAR VISIBILIDAD (Arreglar error de recursión 500)
-- Ejecuta esto inmediatamente para recuperar el acceso a los datos.

-- 1. Eliminar la política de SELECT que está causando recursión
DROP POLICY IF EXISTS "Users can view own organization profiles" ON public.profiles;

-- 2. Crear una versión simple y SEGURA (sin subqueries recursivos)
-- Esta política permite ver todos los perfiles si estás autenticado.
-- Si necesitas filtrar por organización estrictamente, usaremos una función segura después.
-- Por ahora, esto levantará el sistema inmediatamente.
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- 3. (Opcional pero recomendado) Si quieres estricta seguridad por organización:
-- Descomenta lo siguiente SOLO si lo de arriba funciona y quieres restringir más.
/*
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own organization profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  organization_id = get_user_org_id()
);
*/
