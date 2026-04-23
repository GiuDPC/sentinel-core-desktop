import { useAuth } from '../../Contexts/AuthContext'

export default function Header() {
  const { user } = useAuth()

  const greeting = getGreeting()

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8">
      {/* Mensaje de bienvenida */}
      <div>
        <h1 className="text-lg font-semibold text-text-primary font-display">
          {greeting}, {user?.firstName} 👋
        </h1>
        <p className="text-xs text-text-secondary">
          Panel de {getRoleName(user?.role)}
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar tickets..."
            className="w-64 pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function getRoleName(role) {
  const names = {
    ADMIN: 'Administrador',
    TECHNICIAN: 'Técnico',
    REQUESTER: 'Locatario',
  }
  return names[role] || role
}
