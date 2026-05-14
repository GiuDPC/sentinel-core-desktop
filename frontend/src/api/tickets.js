import { api } from './client'

export const ticketsApi = {
  async getAll(filters = {}) {
    return await api.invoke('get_tickets', { payload: filters })
  },

  async getById(id) {
    return await api.invoke('get_ticket', { id })
  },

  async create(data) {
    return await api.invoke('create_ticket', { payload: data })
  },

  async updateStatus(id, status) {
    return await api.invoke('update_ticket_status', { 
      payload: { ticketId: id, status }
    })
  },

  async getMyTickets(filters = {}) {
    return await api.invoke('get_my_tickets', { userId: filters.userId || '' })
  },

  async getAssigned(filters = {}) {
    return await api.invoke('get_assigned_tickets', { technicianId: filters.technicianId || '' })
  },

  async resolveWithNote(ticketId, resolutionNote) {
    return await api.invoke('resolve_ticket', {
      payload: { ticketId, resolutionNote }
    })
  },

  async confirmTicket(ticketId, { confirmed, comment }) {
    return await api.invoke('confirm_ticket', { ticketId })
  },

  // Manteniendo las firmas originales que estaban en tickets.js para no romper React
  async assignTechnician(ticketId, technicianId) {
    return await api.invoke('assign_technician', { 
      payload: { ticketId, technicianId }
    })
  },

  async reassignTechnician(ticketId, technicianId) {
    return await api.invoke('reassign_technician', {
      payload: { ticketId, technicianId }
    })
  },

  async getTechniciansWorkload(department) {
    return await api.invoke('get_workload', { department: department || '' })
  }
}
