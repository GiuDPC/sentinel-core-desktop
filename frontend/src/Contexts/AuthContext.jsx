import { useState, useEffect } from 'react'
import { authApi } from '../api/auth'
import { AuthContext } from './AuthContextObject.js'
import { load } from '@tauri-apps/plugin-store'

let storeInstance = null;
async function getSessionStore() {
  if (!storeInstance) {
    storeInstance = await load('session.dat', { autoSave: false });
  }
  return storeInstance;
}

const ROLE_DASHBOARD_MAP = {
  'ADMIN': '/admin/dashboard',
  'TECHNICIAN': '/technician/dashboard',
  'REQUESTER': '/requester/dashboard',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function checkAuth() {
    try {
      const store = await getSessionStore();
      const savedUser = await store.get('user');

      if (savedUser && savedUser.id) {
        // Re-validate with backend
        const data = await authApi.getCurrentUser(savedUser.id);
        const sessionData = { ...data, role: data.role || savedUser.role };
        setUser(sessionData);
        await store.set('user', sessionData);
        await store.save();
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
      try {
        const store = await getSessionStore();
        await store.delete('user');
        await store.save();
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function login(credentials) {
    setError(null)
    try {
      const data = await authApi.login(credentials)
      const sessionData = { ...data, role: data.role || 'REQUESTER' }

      setUser(sessionData)
      const store = await getSessionStore();
      await store.set('user', sessionData)
      await store.save()

      return sessionData
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function register(userData) {
    setError(null)
    try {
      const data = await authApi.registerPublic(userData)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null)
      const store = await getSessionStore();
      await store.delete('user')
      await store.save()
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
    updateUser: async (userData) => {
      const store = await getSessionStore();
      const sessionData = { ...userData, role: userData.role || user?.role };
      setUser(sessionData);
      await store.set('user', sessionData);
      await store.save();
    },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
