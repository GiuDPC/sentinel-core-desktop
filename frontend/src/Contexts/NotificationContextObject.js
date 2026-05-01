import { createContext, useContext } from 'react'

export const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider')
  }
  return context
}
