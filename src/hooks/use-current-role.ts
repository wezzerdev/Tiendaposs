import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { UserRole } from "@/types"
import { useEmployeeSession } from "@/hooks/use-employee-session"

export function useCurrentRole() {
  const { user } = useAuth()
  const { employee } = useEmployeeSession()

  const { data: role, isLoading } = useQuery({
    queryKey: ["current-role", user?.id],
    queryFn: async () => {
      // Si hay un empleado logueado localmente, usar su rol
      if (employee) return employee.role

      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching role:", error)
        return null
      }
      
      return data?.role as UserRole
    },
    enabled: !!user || !!employee,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  })

  // Si tenemos sesión de empleado activa, asegurarnos que isLoading sea falso inmediatamente
  if (employee && !isLoading && role !== employee.role) {
      // Forzar retorno inmediato si hay discrepancia temporal
      return { role: employee.role, isLoading: false }
  }

  return { role, isLoading }
}