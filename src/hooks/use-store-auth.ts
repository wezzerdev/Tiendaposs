
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Customer } from '@/types'

interface StoreAuthState {
  customer: Customer | null
  login: (customer: Customer) => void
  logout: () => void
}

export const useStoreAuth = create<StoreAuthState>()(
  persist(
    (set) => ({
      customer: null,
      login: (customer) => set({ customer }),
      logout: () => set({ customer: null }),
    }),
    {
      name: 'store-auth-session',
    }
  )
)
