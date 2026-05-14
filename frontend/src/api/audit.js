import { api } from './client'

export const auditApi = {
  async getAll(filters = {}) {
    // Si necesitas mandar filtros, ajusta el comando Rust en el futuro
    return await api.invoke('get_audit_logs')
  },

  async getByTicket(ticketId) {
    return await api.invoke('get_audit_by_ticket', { ticketId })
  }
}
