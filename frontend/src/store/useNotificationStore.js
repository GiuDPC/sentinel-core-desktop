import { create } from 'zustand';
import { api } from '../api/client';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  intervalId: null,

  fetchNotifications: async (userId) => {
    if (!userId) return;
    try {
      const data = await api.invoke('get_notifications', { userId });
      const unreadCount = data.filter(n => n.is_read === 0).length;
      
      set({
        notifications: data,
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  startPolling: (userId) => {
    const { fetchNotifications, intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    
    fetchNotifications(userId);
    const newIntervalId = setInterval(() => fetchNotifications(userId), 10000);
    set({ intervalId: newIntervalId });
  },

  stopPolling: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null, notifications: [], unreadCount: 0 });
  },

  markAsRead: async (id) => {
    try {
      await api.invoke('mark_as_read', { id });
      
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  },

  markAllAsRead: async (userId) => {
    if (!userId) return;
    try {
      await api.invoke('mark_all_as_read', { userId });
      
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: 1 })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  }
}));
