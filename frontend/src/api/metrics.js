import { api } from './client'

export const metricsApi = {
  async getDashboard() {
    return await api.invoke('get_dashboard_metrics')
  },

  async getSlaBreached() {
    return await api.invoke('get_sla_breached')
  },

  async getRequesterMetrics(userId) {
    return await api.invoke('get_requester_metrics', { userId })
  },

  async getTechnicianMetrics(userId) {
    return await api.invoke('get_technician_metrics', { userId })
  },
}
