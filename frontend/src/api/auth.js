const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const authApi = {
  async login({ email, password, rememberMe }) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión')
    }

    // Guardar token si rememberMe es true
    if (rememberMe && data.token) {
      localStorage.setItem('token', data.token)
    } else {
      sessionStorage.setItem('token', data.token)
    }

    return data
  },

  async register({ firstName, lastName, email, password, phone }) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar')
    }

    // Auto-login después de registrar
    if (data.token) {
      sessionStorage.setItem('token', data.token)
    }

    return data
  },

  async logout() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } catch (error) {
        // Ignorar errores en logout
      }
    }

    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener usuario')
    }

    return data
  },

  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  },

  isAuthenticated() {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'))
  },
}