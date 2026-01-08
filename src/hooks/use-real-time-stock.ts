
import { useState, useEffect } from "react"
import { Product } from "@/types"
import { supabase } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"

export function useRealTimeStock() {
  const [reservedStock, setReservedStock] = useState<Record<string, number>>({})
  const [trigger, setTrigger] = useState(0)
  const queryClient = useQueryClient()

  // 1. Calcular reservas locales (Carts en el mismo navegador)
  useEffect(() => {
    const calculateReservations = () => {
      const reservations: Record<string, number> = {}

      // Leer Carrito del POS (localStorage)
      try {
        const posCartRaw = localStorage.getItem('pos-cart')
        if (posCartRaw) {
          const posCart = JSON.parse(posCartRaw) as (Product & { quantity: number })[]
          posCart.forEach(item => {
            reservations[item.id] = (reservations[item.id] || 0) + item.quantity
          })
        }
      } catch (e) { console.error(e) }

      // Leer Carrito de Tienda Online (Zustand persist)
      try {
        const storeCartRaw = localStorage.getItem('store-cart-storage')
        if (storeCartRaw) {
          const storeState = JSON.parse(storeCartRaw)
          const storeItems = storeState.state.items as (Product & { quantity: number })[]
          storeItems.forEach(item => {
            reservations[item.id] = (reservations[item.id] || 0) + item.quantity
          })
        }
      } catch (e) { console.error(e) }

      setReservedStock(reservations)
    }

    calculateReservations()

    // Escuchar cambios locales
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pos-cart' || e.key === 'store-cart-storage') {
        calculateReservations()
      }
    }
    const handleLocalChange = () => calculateReservations()

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cart-updated', handleLocalChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cart-updated', handleLocalChange)
    }
  }, [trigger])

  // 2. Suscripción a Supabase Realtime (Cambios en DB de otros dispositivos)
  useEffect(() => {
    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          // Cuando cambie el stock en la BD, invalidamos la query de productos
          // para que useProducts baje la info fresca.
          console.log('Stock updated realtime:', payload)
          queryClient.invalidateQueries({ queryKey: ['products'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const notifyChange = () => {
    setTrigger(prev => prev + 1)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const getAvailableStock = (product: Product) => {
    if (!product.manage_stock) return 9999
    // Stock Base (DB) - Reservas Locales (Carritos en este navegador)
    // Nota: El producto que pasamos aquí viene de useProducts, que ya debería tener el stock actualizado de la DB
    // gracias a la suscripción realtime.
    const reserved = reservedStock[product.id] || 0
    return Math.max(0, (product.stock || 0) - reserved)
  }

  return {
    getAvailableStock,
    notifyChange
  }
}
