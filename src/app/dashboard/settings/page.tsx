"use client"

import { ThemeCustomizer } from "@/components/settings/theme-customizer"
import { OrganizationSettings } from "@/components/settings/org-settings"
import { useCurrentRole } from "@/hooks/use-current-role"
import { redirect } from "next/navigation"

export default function SettingsPage() {
  const { role, isLoading } = useCurrentRole()

  if (isLoading) return <div className="p-8">Cargando permisos...</div>

  // PROTECCIÓN DE RUTA: Solo admin puede ver esto
  if (role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra las preferencias de tu organización.</p>
      </div>
      
      <div className="grid gap-6">
        <OrganizationSettings />
        <ThemeCustomizer />
      </div>
    </div>
  )
}
