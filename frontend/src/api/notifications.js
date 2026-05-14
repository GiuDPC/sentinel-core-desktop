import { api } from './client'

export const notificationsApi = {
  async getAll(userId) {
    return await api.invoke('get_notifications', { userId })
  },

  async getUnreadCount(userId) {
    // Puede que Rust tenga o no get_unread_count, usamos get_notifications y contamos si no
    const notifs = await api.invoke('get_notifications', { userId });
    return notifs.filter(n => n.is_read === 0).length;
  },

  async markAsRead(id) {
    return await api.invoke('mark_as_read', { id })
  },

  async markAllAsRead(userId) {
    return await api.invoke('mark_all_as_read', { userId })
  }
}
