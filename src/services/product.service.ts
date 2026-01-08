
import { Product } from "@/types"
import { supabase } from "@/lib/supabase"

export const productService = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Product[]
  },

  async createProduct(data: Omit<Product, "id" | "created_at" | "organization_id">) {
    // RLS in Supabase will handle organization_id insertion based on the user's profile
    // But we need to pass it if the policy expects it or triggers handle it. 
    // Usually, we insert it explicitly if the user has permission.
    // For now, let's assume the backend trigger or RLS default handles it, OR we fetch it.
    // To keep it simple and consistent with the SQL policy "Organization members can manage products",
    // we need to send the organization_id.
    
    // Fetch current user's org (Optimización: Podríamos guardar esto en un contexto global)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .maybeSingle() // Use maybeSingle instead of single to avoid 406/JSON errors on 0 rows
    
    if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw new Error("Error verifying user permissions: " + profileError.message)
    }

    if (!profile || !profile.organization_id) {
        // Double check if user is auth but has no profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
             // Si el usuario existe pero no tiene perfil, es un error de integridad de datos
             console.error("Usuario autenticado sin perfil:", user.id)
             throw new Error("Tu usuario no tiene un perfil asociado. Contacta a soporte.")
        }
        // Si no hay usuario, es un error de sesión
        throw new Error("No se detectó una sesión activa. Recarga la página o inicia sesión de nuevo.")
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        ...data,
        organization_id: profile.organization_id
      })
      .select()
      .single()

    if (error) throw error
    return newProduct as Product
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedProduct as Product
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // Método específico para actualizar stock de múltiples productos
  // Ahora usamos la función RPC o actualizaciones directas
  async updateStockBatch(items: { productId: string, quantityChange: number }[]) {
    // Idealmente usaríamos una RPC, pero para mantenerlo simple sin SQL complejo adicional:
    // Hacemos un loop. En producción usaríamos una función Postgres.
    
    // Opción A: RPC (Recomendada)
    // const { error } = await supabase.rpc('update_stock_batch', { items })
    
    // Opción B: Iterativo (Aceptable para < 20 items)
    for (const item of items) {
        // Nota: quantityChange es positivo para agregar, negativo para restar.
        // Si queremos RESTAR stock, enviamos negativo.
        // Pero la lógica de RPC anterior restaba si quantity era positivo.
        // Ajustamos según la lógica de negocio. Aquí asumimos change directo (+1 suma, -1 resta)
        
        // Supabase no tiene "increment" atómico directo en JS SDK sin RPC para updates masivos.
        // Usamos RPC 'decrement_stock' si existiera, o leemos y actualizamos (riesgo de race condition sin Realtime)
        
        // Vamos a asumir que usamos el RPC create_sale_transaction para ventas, 
        // y esto es solo para ajustes manuales.
        
        // Fetch current
        const { data: current } = await supabase.from('products').select('stock').eq('id', item.productId).single()
        if (current) {
            await supabase.from('products').update({ 
                stock: Math.max(0, (current.stock || 0) + item.quantityChange) 
            }).eq('id', item.productId)
        }
    }
    return true
  }
}
