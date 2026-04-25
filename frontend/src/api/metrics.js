import { apiClient } from './client'

export const metricsApi = {
  getDashboard() {
    return apiClient.get('/metrics/dashboard')
  },

  getSlaBreached() {
    return apiClient.get('/metrics/sla-breached')
  },

  getRequesterMetrics() {
    return apiClient.get('/metrics/requester')
  },

  getTechnicianMetrics() {
    return apiClient.get('/metrics/technician')
  },
}
