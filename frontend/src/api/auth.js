import { apiClient } from './client'

/**
 * API de autenticación basada en cookies httpOnly.
 * El backend setea la cookie al hacer login — el frontend no maneja tokens.
 */
export const authApi = {
  async login({ email, password }) {
    const data = await apiClient.post('/auth/login', { email, password })
    return data
  },

  async register({ firstName, lastName, email, password, phone }) {
    const data = await apiClient.post('/auth/register-public', {
      firstName,
      lastName,
      email,
      password,
      confirmPassword: password,
      phone: phone || undefined,
    })
    return data
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignorar errores en logout
    }
  },

  async getCurrentUser() {
    const data = await apiClient.get('/auth/me')
    return data
  },
}