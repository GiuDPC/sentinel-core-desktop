import { api } from './client'

export const backupsApi = {
  async getAll() {
    return await api.invoke('list_backups')
  },

  async createBackup() {
    return await api.invoke('create_backup')
  },

  async downloadBackup(filename) {
    // En desktop/offline nativo, 'download' generalmente implica abrir un diálogo para guardar el archivo
    // Si existe el comando `download_backup` o `export_backup` en Rust:
    return await api.invoke('export_backup', { filename })
  },

  async restoreBackup(filename) {
    return await api.invoke('restore_backup', { filename })
  },

  async deleteBackup(filename) {
    // Si Rust tiene delete_backup:
    return await api.invoke('delete_backup', { filename })
  }
}
