import { api } from './client';

export const authApi = {
  login: async (credentials) => {
    // credentials tiene { email, password }
    return await api.invoke('login', credentials);
  },
  
  register: async (userData) => {
    // userData tiene el RegisterPayload esperado en Rust
    // Tauri requiere que el nombre del argumento coincida con el nombre en Rust
    // En auth.rs el argumento se llama `payload`
    return await api.invoke('register_public', { payload: userData });
  },
  
  logout: async () => {
    return await api.invoke('logout');
  },
  
  getCurrentUser: async (userId) => {
    return await api.invoke('get_profile', { userId });
  },

  changePassword: async (passwordData) => {
    // passwordData: { userId, oldPassword, newPassword }
    return await api.invoke('change_password', { payload: passwordData });
  }
};