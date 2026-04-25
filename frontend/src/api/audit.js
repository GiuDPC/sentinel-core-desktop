import { apiClient } from './client'

export const auditApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.set('page', String(filters.page))
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.action) params.set('action', filters.action)
    const query = params.toString()
    return apiClient.get(`/audit-logs${query ? `?${query}` : ''}`)
  },
}
