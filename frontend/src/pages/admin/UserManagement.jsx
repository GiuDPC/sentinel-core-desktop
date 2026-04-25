import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users'
import notifications from '../../components/ui/Notifications'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const data = await usersApi.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(userId, isActive) {
    try {
      await usersApi.update(userId, { isActive: !isActive })
      notifications.success(
        isActive ? 'Usuario desactivado' : 'Usuario activado',
        'Operacion exitosa'
      )
      loadUsers()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  const roleLabels = {
    ADMIN: { label: 'Administrador', color: 'bg-primary/10 text-primary' },
    TECHNICIAN: { label: 'Técnico', color: 'bg-accent/10 text-accent' },
    REQUESTER: { label: 'Locatario', color: 'bg-success/10 text-success' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">Gestión de Usuarios</h2>
        <p className="text-sm text-text-secondary mt-1">
          Administra los usuarios del centro comercial
        </p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Teléfono</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const roleConfig = roleLabels[user.role?.name || user.role] || { label: user.role?.name || 'Unknown', color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={user.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <span className="text-text-primary font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                    <td className="px-6 py-4 text-text-secondary">{user.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                          user.isActive
                            ? 'border border-danger/30 text-danger hover:bg-danger/10'
                            : 'border border-success/30 text-success hover:bg-success/10'
                        }`}
                      >
                        {user.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
