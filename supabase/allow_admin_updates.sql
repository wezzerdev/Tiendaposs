-- Permitir que los administradores actualicen cualquier perfil de su organización
-- Esto es necesario para poder desactivar/editar otros empleados

CREATE POLICY "Admins can update organization profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  -- El usuario que ejecuta la acción debe ser admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    -- Y ambos deben pertenecer a la misma organización
    AND organization_id = profiles.organization_id
  )
);
