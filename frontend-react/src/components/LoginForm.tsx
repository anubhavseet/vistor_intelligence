import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client/react'
import { useAuth } from '@/hooks/use-auth'
import { LOGIN_MUTATION } from '@/lib/graphql/auth-operations'
import { Mail, Lock, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [login, { loading }] = useMutation(LOGIN_MUTATION)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      const { data } = await login({
        variables: {
          input: { email: email.trim(), password },
        },
      })

      if (data?.login) {
        setAuth(data.login.accessToken, data.login.user)
        navigate('/dashboard')
      }
    } catch (err: any) {
      const errorMessage = err.graphQLErrors?.[0]?.message || err.message || 'Login failed. Please check your credentials.'
      setError(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
        <div className="relative group">
          <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
        <div className="relative group">
          <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 anim-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:translate-y-0"
      >
        {loading ? (
          <RefreshCw className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-center text-gray-500 text-sm">
        Don't have an account? Ask your admin for access.
      </p>
    </form>
  )
}
