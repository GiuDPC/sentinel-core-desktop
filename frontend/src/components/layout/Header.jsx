import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContextObject.js'
import { useNotificationStore } from '../../store/useNotificationStore.js'
import { Bell, Search } from 'lucide-react'
import { useEffect } from 'react'

const NotificationBell = () => {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotificationStore()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative mr-2 text-text-secondary hover:text-accent transition-colors cursor-pointer"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase"
              >
                Limpiar todo
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 font-medium">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id)
                    if (n.link) navigate(n.link)
                    setIsOpen(false)
                  }}
                  className={`px-5 py-4 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex justify-between gap-2 mb-1">
                    <p className={`text-[11px] font-bold ${!n.isRead ? 'text-blue-900' : 'text-slate-700'}`}>{n.title}</p>
                    {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1"></span>}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{n.message}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{new Date(n.createdAt).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { user } = useAuth()
  const { startPolling, stopPolling } = useNotificationStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const greeting = getGreeting()

  useEffect(() => {
    if (user) {
      startPolling()
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [user, startPolling, stopPolling])

  function handleSearch(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim())
      const role = user?.role
      if (role === 'ADMIN') {
        navigate(`/admin/tickets?search=${query}`)
      } else if (role === 'TECHNICIAN') {
        navigate(`/technician/assigned?search=${query}`)
      } else {
        navigate(`/requester/my-tickets?search=${query}`)
      }
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