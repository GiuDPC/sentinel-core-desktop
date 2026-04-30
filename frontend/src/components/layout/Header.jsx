import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContext'
import { Bell, Search } from 'lucide-react'

const NotificationBell = () => {
  return (
    <button
      type="button"
      className="relative mr-2 text-text-secondary hover:text-accent transition-colors cursor-pointer"
      title="Notificaciones"
    >
      <Bell className="w-5 h-5" strokeWidth={1.5} />
      {/* notificacion con un punto rojo indicador de no leídas */}
      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
    </button>
  )
}

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const greeting = getGreeting()

  function handleSearch(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/admin/tickets?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  function handleUserClick() {
    navigate('/profile')
  }

  return (
    <header className="h-12 flex shrink-0 items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-semibold text-text-primary font-display">
          {greeting}, {user?.firstName}!  
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-56 h-8 pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        </div>

        {/* Notification bell */}
        <NotificationBell />

        {/* Botón de perfil - lleva a /profile */}
        <button
          onClick={handleUserClick}
          className="w-7 h-7 rounded-full bg-gray-200 text-black flex items-center justify-center text-sm font-semibold hover:bg-blue-100 hover:text-indigo-600 transition-colors cursor-pointer"
          title="Mi Perfil"
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </button>
      </div>
    </header>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}