import { apiClient } from './client'

export const commentsApi = {
  /**
   * Crea un nuevo comentario en un ticket
   * @param {string} ticketId 
   * @param {object} data { content: string, isInternal: boolean }
   */
  async create(ticketId, data) {
    const res = await apiClient.post(`/tickets/${ticketId}/comments`, data)
    return res.comment || res
  },

  /**
   * Obtiene todos los comentarios de un ticket
   * @param {string} ticketId 
   */
  async getByTicketId(ticketId) {
    const res = await apiClient.get(`/tickets/${ticketId}/comments`)
    return res.comments || res
  }
}
