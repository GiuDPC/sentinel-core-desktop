import { api } from './client'

export const commentsApi = {
  /**
   * Crea un nuevo comentario en un ticket
   * @param {string} ticketId 
   * @param {object} data { content: string, isInternal: boolean }
   */
  async create(ticketId, data) {
    // Mapeamos a CreateCommentPayload: { ticketId, userId, content, isInternal }
    // Asumimos que data trae userId, si no el frontend deberá ajustarlo o pasarlo.
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
   */
  async getByTicketId(ticketId) {
    return await api.invoke('get_comments', { ticketId })
  }
}
