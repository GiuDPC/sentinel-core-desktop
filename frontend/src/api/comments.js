import { api } from './client'

export const commentsApi = {
  /**
   * Crea un nuevo comentario en un ticket
   * @param {string} ticketId 
   * @param {object} data { content: string, isInternal: boolean }
   */
  async create(ticketId, data) {
    return await api.invoke('create_comment', {
      payload: {
        ticketId: ticketId,
        userId: data.userId || '',
        content: data.content,
        isInternal: data.isInternal ? 1 : 0
      }
    })
  },

  /**
   * Obtiene todos los comentarios de un ticket
   * @param {string} ticketId 
   * @param {string} userRole - 'REQUESTER', 'TECHNICIAN', 'ADMIN'
   */
  async getByTicketId(ticketId, userRole) {
    return await api.invoke('get_comments', { ticketId, userRole: userRole || null })
  }
}
