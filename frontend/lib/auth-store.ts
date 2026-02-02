import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token: string, user: User) => {
        set({ token, user })
        // Trigger storage event for other tabs/windows
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
      },
      logout: () => {
        set({ token: null, user: null })
        // Clear Apollo cache on logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
        }
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
)
