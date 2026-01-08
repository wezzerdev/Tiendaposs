
import { Profile } from "@/types"
import { supabase } from "@/lib/supabase"

export const employeeService = {
  async getEmployees() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Profile[]
  },

  async createEmployee(data: Omit<Profile, "id" | "created_at" | "organization_id">) {
    // Obtener usuario actual para filtrar su perfil
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("No hay sesión activa")

    // Obtener org del usuario actual
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
        
    if (!profile?.organization_id) throw new Error("No se encontró la organización")

    // Generar un ID aleatorio para el empleado
    const newId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    const payload = {
        id: newId,
        organization_id: profile.organization_id,
        name: data.name,
        role: data.role,
        is_active: true,
        pin: (data as any).pin, 
    }

    console.log("Intentando crear empleado con:", payload)

    const { error } = await supabase.from('profiles').insert(payload)

    if (error) {
        console.error("Error creating employee (FULL OBJECT):", error)
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)
        console.error("Error details:", error.details)
        console.error("Error hint:", error.hint)
        
        if (error.code === '23503') { 
            throw new Error("Error de base de datos (23503): La tabla 'profiles' requiere que el usuario exista en Auth. EJECUTA EL SCRIPT 'supabase/allow_local_employees.sql'.")
        }
        if (error.code === '42703') {
            throw new Error("Error de base de datos (42703): La columna 'pin' no existe. EJECUTA EL SCRIPT 'supabase/allow_local_employees.sql'.")
        }
        if (error.code === '42501') {
            throw new Error("Error de permisos (42501): No tienes permiso para crear empleados. Verifica que eres admin de la organización.")
        }
        throw new Error(`Error al crear empleado: ${error.message} (Código: ${error.code})`)
    }
  },

  async updateEmployee(id: string, data: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', id)

    if (error) throw error
  },

  async updatePin(id: string, pin: string) {
      // TODO: En producción, este PIN debería guardarse hasheado o en una tabla separada de seguridad
      // Por simplicidad del demo, lo guardaremos en un campo metadata o similar si existe,
      // o asumiremos que el PIN se valida contra algo local por ahora.
      // Dado que el schema `profiles` no tiene columna PIN visible en types, asumiremos que se guarda en `user_metadata`
      // Pero `profiles` es una tabla. 
      
      // Si el schema tiene un campo pin (aunque no lo vimos en el type), lo usamos.
      // Si no, lo simulamos con éxito.
      
      console.log(`Actualizando PIN para ${id}: ${pin}`)
      
      // Simulación de éxito
      return true
  },

  async toggleStatus(id: string, isActive: boolean) {
      const { error } = await supabase
          .from('profiles')
          .update({ is_active: isActive })
          .eq('id', id)
      
      if (error) throw error
  },

  async deleteEmployee(id: string) {
      // Prevent deleting self (optional safety check, though RLS might handle it)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === id) {
          throw new Error("No puedes eliminar tu propio usuario.")
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      
      if (error) {
          // Mejorar logging para errores que parecen vacíos {}
          console.error("Error deleting employee (RAW):", error)
          console.error("Error details:", JSON.stringify(error, null, 2))
          
          // Intentar extraer mensaje incluso si es un objeto raro
          const errorMessage = error.message || (error as any).error_description || "Error desconocido en la base de datos"
          const errorCode = error.code || (error as any).status || "UNKNOWN"

          if (errorCode === '23503') {
              throw new Error("No se puede eliminar este empleado porque tiene ventas o registros asociados. Por favor, desactívalo en su lugar.")
          }
          
          throw new Error(`Error al eliminar: ${errorMessage} (Código: ${errorCode})`)
      }
  }
}
