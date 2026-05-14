import { useState, useEffect } from 'react'
import { authApi } from '../api/auth'
import { AuthContext } from './AuthContextObject.js'
import { load } from '@tauri-apps/plugin-store'

// Cargamos el store de forma diferida (lazy) para evitar top-level await en React
let storeInstance = null;
async function getSessionStore() {
  if (!storeInstance) {
    storeInstance = await load('session.dat', { autoSave: false });
  }
  return storeInstance;
}

/** Mapa de redireccion por rol despues del login */
const ROLE_DASHBOARD_MAP = {
  // Los roles en Rust vienen con ID, pero el mapper los puede inferir o el frontend mapea.
  // En Prisma era ENUM, en Rust es role_id o name. Asumiendo que el login mapea user.role_id -> 'ADMIN'
  1: '/admin/dashboard',
  2: '/technician/dashboard',
  3: '/requester/dashboard',
  // Por si el frontend inyecta un string (retrocompatibilidad):
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
      // 1. Leemos del store la sesión persistida (session.dat)
      const store = await getSessionStore();
      const savedUser = await store.get('user');
      
      if (savedUser && savedUser.id) {
        // 2. Si hay sesión, podríamos re-validar con Rust o confiar en el caché.
        // Hacemos re-fetch para asegurar que el usuario no fue desactivado.
        const data = await authApi.getCurrentUser(savedUser.id);
        
        // El frontend espera el nombre del rol para hasRole. Mapeo simple:
        const roleStr = data.roleId === 1 ? 'ADMIN' : (data.roleId === 2 ? 'TECHNICIAN' : 'REQUESTER');
        const sessionData = { ...data, role: roleStr };
        
        setUser(sessionData);
        // Actualizamos el store en caso de cambios
        await store.set('user', sessionData);
        await store.save();
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
      const store = await getSessionStore();
      await store.delete('user');
      await store.save();
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
      
      // Mapeo role_id -> role string para compatibilidad UI
      const roleStr = data.roleId === 1 ? 'ADMIN' : (data.roleId === 2 ? 'TECHNICIAN' : 'REQUESTER');
      const sessionData = { ...data, role: roleStr };

      setUser(sessionData)
      
      // Guardar en el store de Tauri
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
      const data = await authApi.register(userData)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch(e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null)
      // Limpiar sesión del store
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
    return ROLE_DASHBOARD_MAP[user.role] || ROLE_DASHBOARD_MAP[user.roleId] || '/login'
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
      setUser(userData);
      const store = await getSessionStore();
      await store.set('user', userData);
      await store.save();
    },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}