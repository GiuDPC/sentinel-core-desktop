import { api } from './client'

export const ticketsApi = {
  async getAll(filters = {}) {
    return await api.invoke('get_tickets', { filters })
  },

  async getById(id) {
    return await api.invoke('get_ticket', { id })
  },

  async create(data) {
    return await api.invoke('create_ticket', { payload: data })
  },

  async updateStatus(id, status, userId) {
    return await api.invoke('update_ticket_status', {
      payload: { ticketId: id, status },
      userId
    })
  },

  async getMyTickets(userId, filters = {}) {
    return await api.invoke('get_my_tickets', { userId, filters })
  },

  async getAssigned(technicianId, filters = {}) {
    return await api.invoke('get_assigned_tickets', { technicianId, filters })
  },

  async resolveWithNote(ticketId, resolutionNote, userId) {
    return await api.invoke('resolve_ticket', {
      payload: { ticketId, resolutionNote },
      userId
    })
  },

  async confirmTicket(ticketId, userId, confirmed, comment) {
    return await api.invoke('confirm_ticket', {
      payload: { ticketId, confirmed, comment: comment || null },
      userId
    })
  },

  async assignTechnician(ticketId, technicianId, assignedBy) {
    return await api.invoke('assign_technician', {
      payload: { ticketId, technicianId, assignedBy }
    })
  },

  async reassignTechnician(ticketId, technicianId, assignedBy) {
    return await api.invoke('reassign_technician', {
      payload: { ticketId, technicianId, assignedBy }
    })
  },

  async getTechniciansWorkload(department) {
    return await api.invoke('get_workload', { department: department || '' })
  }
}
