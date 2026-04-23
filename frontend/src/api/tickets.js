import { apiClient } from './client'

export const ticketsApi = {
  getAll(filters = {}) {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
    if (filters.page) params.set('page', String(filters.page))
    if (filters.limit) params.set('limit', String(filters.limit))
    const query = params.toString()
    return apiClient.get(`/tickets${query ? `?${query}` : ''}`)
  },

  getById(id) {
    return apiClient.get(`/tickets/${id}`)
  },

  create(data) {
    return apiClient.post('/tickets', data)
  },

  updateStatus(id, status) {
    return apiClient.patch(`/tickets/${id}/status`, { status })
  },

  getMyTickets(filters = {}) {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.page) params.set('page', String(filters.page))
    const query = params.toString()
    return apiClient.get(`/tickets/my-tickets${query ? `?${query}` : ''}`)
  },

  getAssigned(filters = {}) {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    const query = params.toString()
    return apiClient.get(`/tickets/assigned${query ? `?${query}` : ''}`)
  },

  assignTechnician(ticketId, technicianId) {
    return apiClient.post(`/tickets/${ticketId}/assign`, { technicianId })
  },

  getTechniciansWorkload(department) {
    const query = department ? `?department=${department}` : ''
    return apiClient.get(`/tickets/technicians/workload${query}`)
  },
}
