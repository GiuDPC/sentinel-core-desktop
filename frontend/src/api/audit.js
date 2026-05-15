import { api } from './client'

export const auditApi = {
  async getAll(filters = {}) {
    return await api.invoke('get_audit_logs', { filters })
  },

  async getByTicket(ticketId) {
    return await api.invoke('get_audit_by_ticket', { ticketId })
  }
}
