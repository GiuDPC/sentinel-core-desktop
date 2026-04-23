import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContext'

/** Configuración de navegación por rol */
const NAV_ITEMS = [
  // ── Solicitante (Locatario) ──
  { label: 'Mi Dashboard', path: '/requester/dashboard', icon: '📊', roles: ['REQUESTER'] },
  { label: 'Mis Tickets', path: '/requester/my-tickets', icon: '🎫', roles: ['REQUESTER'] },
  { label: 'Nuevo Reporte', path: '/requester/create-ticket', icon: '➕', roles: ['REQUESTER'] },

  // ── Técnico ──
  { label: 'Mi Dashboard', path: '/technician/dashboard', icon: '📊', roles: ['TECHNICIAN'] },
  { label: 'Tickets Asignados', path: '/technician/assigned', icon: '🔧', roles: ['TECHNICIAN'] },

  // ── Admin ──
  { label: 'Dashboard', path: '/admin/dashboard', icon: '📊', roles: ['ADMIN'] },
  { label: 'Todos los Tickets', path: '/admin/tickets', icon: '🎫', roles: ['ADMIN'] },
  { label: 'Usuarios', path: '/admin/users', icon: '👥', roles: ['ADMIN'] },
  { label: 'Categorías', path: '/admin/categories', icon: '📁', roles: ['ADMIN'] },
  { label: 'Reportes', path: '/admin/reports', icon: '📈', roles: ['ADMIN'] },
]

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) => hasRole(item.roles))

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-primary text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-light">
        <h2 className="font-display text-xl font-bold tracking-tight">
          🛡️ SentinelCore
        </h2>
        <p className="text-xs text-white/60 mt-1">Centro Comercial</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-light text-white'
                      : 'text-white/70 hover:bg-primary-light/50 hover:text-white'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer — Logout */}
      <div className="p-4 border-t border-primary-light">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-white/50">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-danger/20 rounded-lg transition-colors cursor-pointer"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
