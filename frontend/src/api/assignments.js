import { api } from './client'

export const assignmentsApi = {
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
