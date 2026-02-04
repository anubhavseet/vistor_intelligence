'use client'

import { useState } from 'react'
import Link from 'next/link'
import LoginForm from '@/components/LoginForm'
import SignupForm from '@/components/SignupForm'
import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🚀 Visitor Intelligence
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2 rounded-xl transition-all duration-300 font-medium ${isLogin
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2 rounded-xl transition-all duration-300 font-medium ${!isLogin
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm"
              >
                ✨ AI-Powered Intelligence Platform
              </motion.div>

              <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Unlock the Power of
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  Visitor Intelligence
                </span>
              </h2>

              <p className="text-xl text-gray-300 leading-relaxed">
                Transform anonymous website visitors into actionable insights. Our AI-powered platform crawls,
                analyzes, and predicts buyer intent in real-time.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { icon: '🗺️', title: 'Live Visitor Map', desc: 'Real-time geographic visualization' },
                { icon: '🤖', title: 'AI Crawling', desc: 'Automated website content indexing' },
                { icon: '🎯', title: 'Intent Scoring', desc: 'AI-powered buyer prediction' },
                { icon: '📊', title: 'Account Intelligence', desc: 'Company-level analytics' },
                { icon: '⚡', title: 'RAG-Powered', desc: 'Semantic search with Qdrant' },
                { icon: '🔒', title: 'Privacy-First', desc: 'GDPR & CCPA compliant' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center space-x-8 pt-4"
            >
              <div>
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-400">Pages Crawled</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">95%</div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">Real-time</div>
                <div className="text-sm text-gray-400">Processing</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            className="lg:pl-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 max-w-md mx-auto lg:max-w-none">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h3>
                <p className="text-gray-300">
                  {isLogin
                    ? 'Sign in to access your dashboard'
                    : 'Start tracking and understanding your visitors'}
                </p>
              </div>

              {isLogin ? (
                <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
              ) : (
                <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
              )}
            </div>

            <p className="mt-6 text-center text-sm text-gray-400">
              By continuing, you agree to our{' '}
              <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Terms</span> and{' '}
              <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Privacy Policy</span>
            </p>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          className="mt-24 space-y-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features, Simple Setup
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Everything you need to understand your visitors and convert them into customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Automated Website Crawling',
                description: 'Add your website URL and let our AI crawl every page. Content is indexed in Qdrant for powerful RAG-based insights.',
                icon: '🕷️',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                title: 'Real-time Intent Detection',
                description: 'AI analyzes visitor behavior to predict purchase intent. Get alerts when high-value prospects visit your site.',
                icon: '🎯',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                title: 'Non-blocking Background Jobs',
                description: 'BullMQ powers our crawling infrastructure. Process thousands of pages without impacting your dashboard performance.',
                icon: '⚡',
                gradient: 'from-green-500 to-emerald-500',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 bg-black/20 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Visitor Intelligence. Powered by AI, built for growth.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
