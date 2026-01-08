"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Archive,
  Globe,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  Receipt,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useCurrentRole } from "@/hooks/use-current-role"
import { UserRole } from "@/types"

type SidebarItem = {
  title: string
  url: string
  icon: any
  roles?: UserRole[]
}

const items: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager"],
  },
  {
    title: "Punto de Venta",
    url: "/dashboard/pos",
    icon: ShoppingCart,
    roles: ["admin", "manager", "seller"],
  },
  {
    title: "Ventas",
    url: "/dashboard/sales",
    icon: Receipt,
    roles: ["admin", "manager", "seller"],
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Archive,
    roles: ["admin", "manager", "inventory"],
  },
  {
    title: "Tienda Online",
    url: "/dashboard/ecommerce",
    icon: Globe,
    roles: ["admin", "manager"],
  },
  {
    title: "Empleados",
    url: "/dashboard/employees",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"],
  },
]

import { NavUser } from "@/components/nav-user"

export function AppSidebar() {
  const { role, isLoading } = useCurrentRole()

  const filteredItems = items.filter((item) => {
    // Si no hay roles definidos, es público (aunque aquí todos tienen roles)
    if (!item.roles) return true
    // Si está cargando o no hay rol, ocultamos por seguridad
    if (!role) return false
    return item.roles.includes(role)
  })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-sidebar-border flex items-center justify-center">
        <div className="flex items-center gap-2 font-bold text-xl px-4 w-full">
          <div className="size-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
            TP
          </div>
          <span className="group-data-[collapsible=icon]:hidden">TiendaPOS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
                </div>
              ) : (
                filteredItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
