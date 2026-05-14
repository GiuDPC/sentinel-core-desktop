import { api } from './client'

export const usersApi = {
  async getAll() {
    return await api.invoke('get_users')
  },

  async getById(id) {
    return await api.invoke('get_user', { id })
  },

  async update(id, data) {
    return await api.invoke('update_user', { 
      payload: { id, ...data } 
    })
  },

  async deactivate(id) {
    return await api.invoke('deactivate_user', { id })
  },

  async updateProfile(data) {
    // Si existe un update_profile específico en Rust
    return await api.invoke('update_profile', { payload: data })
  },
}
