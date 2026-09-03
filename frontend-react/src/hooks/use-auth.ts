import { useAuthStore } from '@/store/auth-store'
import { useApolloClient } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { restartWsConnection } from '@/lib/apollo-client'

export function useAuth() {
    const { user, token, setAuth: rawSetAuth, logout, isAuthenticated } = useAuthStore()
    const client = useApolloClient()
    const navigate = useNavigate()

    const handleSetAuth = (token: string, user: Parameters<typeof rawSetAuth>[1]) => {
        rawSetAuth(token, user)
        restartWsConnection()
    }

    const handleLogout = async () => {
        logout()
        restartWsConnection()
        await client.resetStore()
        navigate('/')
    }

    return {
        user,
        token,
        setAuth: handleSetAuth,
        logout: handleLogout,
        isAuthenticated: isAuthenticated(),
    }
}
