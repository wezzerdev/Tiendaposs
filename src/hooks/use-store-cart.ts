
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'
import { useRealTimeStock } from './use-real-time-stock'

export type CartItem = Product & { quantity: number }

interface StoreCartState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  clearCart: () => void
  total: number
}

// Helper para validar stock usando el hook existente no es posible directamente dentro de zustand
// así que usaremos una lógica simplificada que confía en la UI para la validación inicial
// y validación dura aquí.

export const useStoreCart = create<StoreCartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      addItem: (product) => {
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === product.id)
        
        if (existingItem) {
           // La validación de stock máximo se hace en la UI con useRealTimeStock
           // Aquí solo incrementamos
           const newItems = currentItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
          set({ 
              items: newItems,
              total: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
          })
        } else {
            const newItems = [...currentItems, { ...product, quantity: 1 }]
            set({ 
                items: newItems, 
                total: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
            })
        }
      },
      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.id !== productId)
        set({ 
            items: newItems,
            total: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
        })
      },
      updateQuantity: (productId, delta) => {
        const newItems = get().items.map((item) => {
          if (item.id === productId) {
            // Check stock logic simplificada
            if (delta > 0 && item.manage_stock) {
                // Permitimos subir, la UI bloqueará si no hay stock real
            }
            const newQuantity = Math.max(1, item.quantity + delta)
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        set({ 
            items: newItems,
            total: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
        })
      },
      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: 'store-cart-storage',
    }
  )
)
