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
            },
            logout: () => {
                localStorage.removeItem('auth-token')
                set({ token: null, user: null })
            },
            isAuthenticated: () => {
                return !!get().token
            },
        }),
        {
            name: 'auth-storage',
        }
    )
)

// Cross-tab sync: native 'storage' event fires in OTHER tabs when localStorage
// changes, so logging out in one tab automatically logs out all others.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'auth-token' && e.newValue === null) {
            useAuthStore.getState().logout()
        }
    })
}
