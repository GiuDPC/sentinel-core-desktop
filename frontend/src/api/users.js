import { apiClient } from './client'

export const usersApi = {
  getAll() {
    return apiClient.get('/users')
  },

  getById(id) {
    return apiClient.get(`/users/${id}`)
  },

  update(id, data) {
    return apiClient.put(`/users/${id}`, data)
  },

  delete(id) {
    return apiClient.delete(`/users/${id}`)
  },
}
