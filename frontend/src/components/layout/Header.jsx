import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContext'

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
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8">
      <div>
        <h1 className="text-lg font-semibold text-text-primary font-display">
          {greeting}, {user?.firstName}
        </h1>
        <p className="text-xs text-text-secondary">
          Panel de {getRoleName(user?.role)}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-64 pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        {/* Botón de perfil - lleva a /profile */}
        <button
          onClick={handleUserClick}
          className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold hover:bg-accent/90 transition-colors cursor-pointer"
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

function getRoleName(role) {
  const names = {
    ADMIN: 'Administrador',
    TECHNICIAN: 'Tecnico',
    REQUESTER: 'Locatario',
  }
  return names[role] || role
}