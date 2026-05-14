import { invoke } from '@tauri-apps/api/core';

export const api = {
  invoke: async (command, args = {}) => {
    try {
      return await invoke(command, args);
    } catch (error) {
      // El error viene de Rust (nuestro AppError serializado como String)
      const errorMsg = typeof error === 'string' ? error : error.message || 'Error desconocido del sistema';
      console.error(`[IPC Error] ${command}:`, errorMsg);
      // Lanzamos un Error genérico para que try/catch del frontend lo reciba limpio
      throw new Error(errorMsg);
    }
  }
};
