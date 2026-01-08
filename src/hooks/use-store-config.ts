import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export type StoreConfig = {
  isActive: boolean
  bannerText: string
  name: string
  address?: string
  phone?: string
  logo_url?: string
  primaryColor?: string
}

const DEFAULT_CONFIG: StoreConfig = {
  isActive: true, // Default active for demo
  bannerText: "¡Envío gratis en compras mayores a $999!",
  name: "Tienda Demo"
}

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      try {
        // 1. Detectar slug desde Subdominio o Query Param
        let slug = ""
        
        // A) Subdominio (ej. tienda-x.dominio.com)
        const hostname = window.location.hostname
        const parts = hostname.split('.')
        if (parts.length > 2 && parts[0] !== 'www') {
             slug = parts[0]
        }

        // B) Query Param (ej. ?store=tienda-x) - útil para desarrollo
        const params = new URLSearchParams(window.location.search)
        if (params.get('store')) {
            slug = params.get('store')!
        }

        // C) Si no hay slug público, intentar cargar la org del usuario logueado (Vista Previa Admin)
        if (!slug) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Buscar la org del usuario
                const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
                if (profile?.organization_id) {
                    const { data: org } = await supabase.from('organizations').select('slug').eq('id', profile.organization_id).single()
                    if (org) slug = org.slug
                }
            }
        }

        if (slug) {
            const { data, error } = await supabase.rpc('get_public_store_config', { p_slug: slug })
            if (data) {
                setConfig({
                    isActive: data.isActive,
                    bannerText: data.bannerText || DEFAULT_CONFIG.bannerText,
                    name: data.name,
                    address: data.address,
                    phone: data.phone,
                    logo_url: data.logo_url,
                    primaryColor: data.primaryColor
                })
            }
        }
      } catch (error) {
        console.error("Error loading store config:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadConfig()
  }, [])

  // Guardar configuración (Solo local para demo, o implementar guardado real si es admin)
  const updateConfig = (newConfig: Partial<StoreConfig>) => {
    const updated = { ...config, ...newConfig }
    setConfig(updated)
    // localStorage.setItem("store-config", JSON.stringify(updated))
  }

  return {
    config,
    updateConfig,
    isLoaded
  }
}
