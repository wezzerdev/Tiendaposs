import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Profile } from '@/types'

interface EmployeeSessionState {
  employee: Profile | null
  login: (employee: Profile) => void
  logout: () => void
}

export const useEmployeeSession = create<EmployeeSessionState>()(
  persist(
    (set) => ({
      employee: null,
      login: (employee) => set({ employee }),
      logout: () => set({ employee: null }),
    }),
    {
      name: 'employee-session',
    }
  )
)