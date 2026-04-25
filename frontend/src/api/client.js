const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Cliente API base con soporte de cookies httpOnly.
 * Todas las peticiones envían/reciben cookies automáticamente.
 */
async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en la petición')
  }

  return data
}

export const apiClient = {
  get: (endpoint) => request(endpoint),

  post: (endpoint, body) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (endpoint) =>
    request(endpoint, { method: 'DELETE' }),
}
