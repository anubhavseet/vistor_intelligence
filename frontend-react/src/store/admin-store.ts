import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
    id: string
    email: string
    name: string
    role: string
}

interface AdminState {
    token: string | null
    user: AdminUser | null
    setAuth: (token: string, user: AdminUser) => void
    logout: () => void
    isAuthenticated: () => boolean
    isAdmin: () => boolean
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            setAuth: (token: string, user: AdminUser) => {
                localStorage.setItem('admin-auth-token', token)
                set({ token, user })
            },
            logout: () => {
                localStorage.removeItem('admin-auth-token')
                set({ token: null, user: null })
            },
            isAuthenticated: () => {
                return !!get().token
            },
            isAdmin: () => {
                const user = get().user
                return !!user && user.role === 'admin'
            },
        }),
        {
            name: 'admin-auth-storage',
        }
    )
)
