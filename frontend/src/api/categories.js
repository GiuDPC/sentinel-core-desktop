import { api } from './client'

export const categoriesApi = {
  async getAll() {
    return await api.invoke('get_categories')
  },

  async getById(id) {
    // Asumiendo que se requiere, aunque el backend Rust no lo tiene implementado aún
    // Podés crear el comando 'get_category' en Rust luego.
    return await api.invoke('get_category', { id: Number(id) })
  },

  async create(data) {
    return await api.invoke('create_category', { payload: data })
  },

  async update(id, data) {
    return await api.invoke('update_category', { 
      payload: { id: Number(id), ...data } 
    })
  },

  async delete(id) {
    return await api.invoke('delete_category', { id: Number(id) })
  }
}
