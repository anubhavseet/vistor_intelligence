'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginForm from '@/components/LoginForm'
import SignupForm from '@/components/SignupForm'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated()) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Visitor Intelligence
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isLogin
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !isLogin
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Track Anonymous Visitors.
                <span className="block text-primary-600">Predict Buyer Intent.</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                B2B visitor intelligence platform that helps you identify high-intent accounts
                visiting your website. Privacy-compliant, GDPR-ready, and built for scale.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Live Visitor Map</h3>
                </div>
                <p className="text-sm text-gray-600">Real-time geographic visualization</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Intent Scoring</h3>
                </div>
                <p className="text-sm text-gray-600">AI-powered buyer intent prediction</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Account Intelligence</h3>
                </div>
                <p className="text-sm text-gray-600">Company-level visitor aggregation</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Privacy-First</h3>
                </div>
                <p className="text-sm text-gray-600">GDPR, CCPA, DPDP compliant</p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="lg:pl-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md mx-auto lg:max-w-none">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h3>
                <p className="text-gray-600">
                  {isLogin
                    ? 'Sign in to access your dashboard'
                    : 'Create your account to start tracking visitors'}
                </p>
              </div>

              {isLogin ? (
                <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
              ) : (
                <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
              )}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Visitor Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
