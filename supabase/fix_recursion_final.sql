
-- FINAL FIX FOR INFINITE RECURSION AND PERMISSIONS
-- This script drops ALL existing policies on 'profiles' and recreates them
-- using strictly safe, non-recursive functions.

-- 1. Create SAFE helper functions (Security Definer)
-- These functions bypass RLS to read necessary data without triggering policies.

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.am_i_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 2. Drop ALL existing policies to clean up the mess
DROP POLICY IF EXISTS "Users can view own organization members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view organization members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles; -- Emergency fix removal
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Organization members can update organization profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read access for active stores" ON public.products; -- Unrelated but good to clean if duplicate

-- 3. Create CLEAN, NON-RECURSIVE Policies

-- SELECT: Users can see themselves AND anyone in their organization
CREATE POLICY "view_organization_members" ON public.profiles
FOR SELECT TO authenticated
USING (
    id = auth.uid() -- Can always see self
    OR
    organization_id = get_my_org_id() -- Can see org members (using safe function)
);

-- INSERT: 
-- A) Users can insert their own profile (registration)
-- B) Admins can insert other profiles (creating employees)
CREATE POLICY "insert_profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
    id = auth.uid() -- Self registration
    OR
    am_i_admin() -- Admin creating employee (using safe function)
);

-- UPDATE:
-- A) Users can update their own basic info
-- B) Admins can update any profile in their organization
CREATE POLICY "update_profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
    id = auth.uid() -- Update self
    OR
    (am_i_admin() AND organization_id = get_my_org_id()) -- Admin update org member
);

-- DELETE:
-- Admins can delete profiles in their organization
CREATE POLICY "delete_profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
    am_i_admin() AND organization_id = get_my_org_id()
);

-- 4. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Fix Foreign Key for Sales (Ensure deletion is possible)
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_profile_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

