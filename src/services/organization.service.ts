
import { Organization } from "@/types"
import { supabase } from "@/lib/supabase"

export const organizationService = {
  async getOrganization() {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .single()

    if (error) throw error
    return data as Organization
  },

  async updateOrganization(data: Partial<Organization>) {
    // Necesitamos el ID. Asumimos que el usuario solo tiene una org.
    const { data: current } = await supabase.from('organizations').select('id').single()
    if (!current) throw new Error("Organization not found")

    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update(data)
      .eq('id', current.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error("El identificador (slug) ya está en uso. Por favor elige otro.")
      }
      throw error
    }
    return updatedOrg as Organization
  }
}
