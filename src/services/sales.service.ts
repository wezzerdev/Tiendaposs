
import { supabase } from "@/lib/supabase"

export type SaleItem = {
    id: string
    product_id: string
    product_name: string
    quantity: number
    price: number
    total: number
}

export type Sale = {
    id: string
    organization_id: string
    branch_id?: string
    profile_id?: string // Empleado que hizo la venta
    customer_id?: string
    customer_name?: string
    total: number
    payment_method: 'cash' | 'card'
    status: 'completed' | 'refunded'
    items: SaleItem[]
    created_at: string
}

export const salesService = {
  async getSales() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Sale[]
  },

  async createSale(data: Omit<Sale, "id" | "created_at" | "organization_id">) {
    // 1. Obtener usuario y organización actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuario no autenticado")

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
    
    if (!profile) throw new Error("Perfil no encontrado")

    // 2. Preparar datos para RPC
    // El RPC espera: p_organization_id, p_customer_id, p_profile_id, p_total, p_payment_method, p_items (jsonb)
    const rpcParams = {
        p_organization_id: profile.organization_id,
        p_customer_id: data.customer_id || null,
        p_profile_id: user.id,
        p_total: data.total,
        p_payment_method: data.payment_method,
        p_items: data.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total
        }))
    }

    // 3. Llamar a la función atómica
    const { data: saleId, error } = await supabase.rpc('create_sale_transaction', rpcParams)

    if (error) {
        console.error("Error creating sale:", error)
        throw new Error("Error al procesar la venta: " + error.message)
    }

    // 4. Retornar la venta creada (opcionalmente podríamos devolverla desde el RPC, pero devolvimos ID)
    // Para velocidad, construimos el objeto o hacemos fetch. Hacemos fetch para confirmar.
    const { data: newSale } = await supabase
        .from('sales')
        .select('*, items:sale_items(*)')
        .eq('id', saleId)
        .single()
        
    return newSale as Sale
  }
}
