import { createContext, useState, useEffect, useContext } from 'react'
import { authApi } from '../api/auth'

export const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

/** Mapa de redireccion por rol despues del login */
const ROLE_DASHBOARD_MAP = {
  ADMIN: '/admin/dashboard',
  TECHNICIAN: '/technician/dashboard',
  REQUESTER: '/requester/dashboard',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const data = await authApi.getCurrentUser()
      setUser(data.user || data)
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
      await authApi.register(userData)
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

  function hasRole(roles) {
    if (!user) return false
    const allowed = Array.isArray(roles) ? roles : [roles]
    return allowed.includes(user.role)
  }

  function getDashboardPath() {
    if (!user) return '/login'
    return ROLE_DASHBOARD_MAP[user.role] || '/login'
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
    getDashboardPath,
    clearError: () => setError(null),
    updateUser: (userData) => setUser(userData),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}