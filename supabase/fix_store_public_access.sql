
-- Permitir acceso público a la configuración de la tienda (para la Landing/Store)
-- Creamos una función segura que devuelve solo la info necesaria dado un slug.

CREATE OR REPLACE FUNCTION public.get_public_store_config(p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid;
    v_config json;
BEGIN
    -- 1. Buscar Organización por Slug
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = p_slug;
    
    IF v_org_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Obtener Configuración y Datos Públicos de la Org
    SELECT json_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'address', o.address,
        'phone', o.phone,
        'logo_url', o.logo_url,
        'isActive', COALESCE(sc.is_active, false),
        'bannerText', sc.banner_text,
        'primaryColor', sc.primary_color
    ) INTO v_config
    FROM public.organizations o
    LEFT JOIN public.store_configs sc ON sc.organization_id = o.id
    WHERE o.id = v_org_id;

    RETURN v_config;
END;
$$;

-- Grant public access to this function
GRANT EXECUTE ON FUNCTION public.get_public_store_config(text) TO anon, authenticated, service_role;
