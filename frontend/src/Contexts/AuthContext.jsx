import { createContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export { useAuth }
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      if (authApi.isAuthenticated()) {
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(credentials) {
    setError(null)
    try {
      const data = await authApi.login(credentials)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function register(userData) {
    setError(null)
    try {
      // Registrar usuario
      await authApi.register(userData)
      // Auto-login después de registro exitoso
      const loginData = await authApi.login({
        email: userData.email,
        password: userData.password,
      })
      setUser(loginData.user)
      return loginData
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError: () => setError(null),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}