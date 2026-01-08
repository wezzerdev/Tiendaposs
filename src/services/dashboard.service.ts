
import { supabase } from "@/lib/supabase"

export type DashboardStats = {
    totalSales: number
    pendingOrders: number
    lowStock: number
    recentActivity: {
        id: string
        description: string
        amount?: number
        time: string
    }[]
}

export const dashboardService = {
  async getStats() {
    // 1. Fetch Sales (Limitado a últimos X o todos para total? Idealmente una view o RPC para totales históricos)
    // Para MVP, fetch de 'total' de todas las ventas completadas.
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, total, created_at, status, items:sale_items(count)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
    
    if (salesError) throw salesError

    // 2. Fetch Products (para Low Stock)
    // Nota: El RLS filtra automáticamente por organization_id
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('stock, min_stock_alert')
    
    // Si no hay productos o hay error de RLS (ej. usuario nuevo sin productos), 
    // manejamos el error gracefully para no romper el dashboard
    if (prodError) {
        console.warn("Error fetching products for stats:", prodError)
        // No lanzamos error, retornamos array vacío
    }

    const safeProducts = products || []

    // Calcular Totales
    const totalSales = sales?.reduce((acc, curr) => acc + curr.total, 0) || 0

    // Calcular Stock Bajo
    const lowStock = safeProducts.filter(p => (p.stock || 0) <= (p.min_stock_alert || 0)).length

    // Actividad Reciente (Últimas 5 ventas)
    // Nota: sales ya está ordenado desc
    const recentActivity = sales?.slice(0, 5).map(sale => ({
        id: sale.id,
        description: `Venta #${sale.id.slice(0, 8)}... - ${sale.items[0]?.count || 1} items`,
        amount: sale.total,
        time: new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })) || []

    return {
        totalSales,
        pendingOrders: 0, // Implementar si añadimos lógica de pedidos
        lowStock,
        recentActivity
    }
  },

  async getSalesChartData() {
    // Obtener ventas de los últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: sales, error } = await supabase
        .from('sales')
        .select('total, created_at')
        .eq('status', 'completed')
        .gte('created_at', sixMonthsAgo.toISOString())

    if (error) throw error

    // Agrupar por mes
    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        return {
            date: d,
            monthName: d.toLocaleString('es-MX', { month: 'long' }),
            key: `${d.getFullYear()}-${d.getMonth()}`
        }
    })

    const chartData = last6Months.map(({ monthName, key }) => {
        const monthSales = sales?.filter(s => {
            const d = new Date(s.created_at)
            return `${d.getFullYear()}-${d.getMonth()}` === key
        }).reduce((acc, curr) => acc + curr.total, 0) || 0

        return {
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            sales: monthSales
        }
    })

    return chartData
  }
}
