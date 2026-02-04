import { useAuthStore } from '@/store/auth-store'
import { useApolloClient } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
    const { user, token, setAuth, logout, isAuthenticated } = useAuthStore()
    const client = useApolloClient()
    const navigate = useNavigate()

    const handleLogout = async () => {
        logout()
        await client.resetStore() // Clear Apollo cache safely
        navigate('/')
    }

    return {
        user,
        token,
        setAuth,
        logout: handleLogout,
        isAuthenticated: isAuthenticated(),
    }
}
