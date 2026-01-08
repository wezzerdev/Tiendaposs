-- Permitir empleados locales (sin usuario de Auth) y PIN
-- Ejecuta este script en el Editor SQL de Supabase

-- 1. Eliminar la restricción de clave foránea que obliga a que el ID del perfil sea un usuario de Auth
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Asegurar que existe la columna PIN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin') THEN
        ALTER TABLE public.profiles ADD COLUMN pin text;
    END IF;
END $$;

-- 3. Crear política para permitir insertar perfiles (si no existe)
-- Nota: Ajusta según tus necesidades de seguridad. Aquí permitimos a los admins crear perfiles.
CREATE POLICY "Admins can create profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
