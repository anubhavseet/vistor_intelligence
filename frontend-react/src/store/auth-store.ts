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
                localStorage.setItem('auth-token', token)
                set({ token, user })
                // Trigger storage event for other tabs/windows
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('storage'))
                }
            },
            logout: () => {
                localStorage.removeItem('auth-token')
                set({ token: null, user: null })
                // Trigger storage event to notify other parts of the app
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('storage'))
                    // Optional: Clear Apollo cache here or in a listener
                }
            },
            isAuthenticated: () => {
                return !!get().token
            },
        }),
        {
            name: 'auth-storage',
            // Ensure we use localStorage consistently
        }
    )
)
