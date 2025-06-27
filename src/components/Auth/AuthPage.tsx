import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { useAuth } from '../../hooks/useAuth'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await signUp(email, password, fullName)
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {isLogin ? (
            <LoginForm
              onLogin={handleLogin}
              onToggleMode={() => setIsLogin(false)}
              loading={loading}
            />
          ) : (
            <SignupForm
              onSignup={handleSignup}
              onToggleMode={() => setIsLogin(true)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}