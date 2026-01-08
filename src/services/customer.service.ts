
import { Customer } from "@/types"
import { supabase } from "@/lib/supabase"

export const customerService = {
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Customer[]
  },

  createCustomer: async (customerData: Omit<Customer, "id" | "created_at" | "organization_id">): Promise<Customer> => {
    const { data: profile } = await supabase.from('profiles').select('organization_id').maybeSingle()
    if (!profile?.organization_id) throw new Error("No organization found for current user")

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        organization_id: profile.organization_id
      })
      .select()
      .single()

    if (error) throw error
    return data as Customer
  },

  updateCustomer: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Customer
  },
  
  deleteCustomer: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
