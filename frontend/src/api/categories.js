import { apiClient } from './client'

export const categoriesApi = {
  getAll() {
    return apiClient.get('/categories')
  },

  getById(id) {
    return apiClient.get(`/categories/${id}`)
  },
}
