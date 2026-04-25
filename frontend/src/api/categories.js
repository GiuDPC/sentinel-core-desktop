import { apiClient } from './client'

export const categoriesApi = {
  async getAll() {
    const data = await apiClient.get('/categories')
    return data.categories || data.data || data || []
  },

  getById(id) {
    return apiClient.get(`/categories/${id}`)
  },
}
