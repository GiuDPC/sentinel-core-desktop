import { api } from './client';

export const authApi = {
  login: async (credentials) => {
    return await api.invoke('login', {
      email: credentials.email,
      password: credentials.password
    });
  },

  register: async (userData) => {
    return await api.invoke('register', { payload: userData });
  },

  registerPublic: async (userData) => {
    return await api.invoke('register_public', { payload: userData });
  },

  logout: async () => {
    return await api.invoke('logout');
  },

  getCurrentUser: async (userId) => {
    return await api.invoke('get_profile', { userId });
  },

  changePassword: async (passwordData) => {
    const payload = {
      userId: passwordData.userId,
      oldPassword: passwordData.oldPassword || passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };
    return await api.invoke('change_password', { payload });
  }
};
