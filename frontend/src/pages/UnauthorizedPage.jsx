import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Contexts/AuthContext'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  const { getDashboardPath } = useAuth()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl block mb-4">🚫</span>
        <h1 className="text-3xl font-bold text-text-primary font-display mb-2">Acceso Denegado</h1>
        <p className="text-text-secondary mb-6">No tienes permisos para acceder a esta sección</p>
        <button
          onClick={() => navigate(getDashboardPath())}
          className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
        >
          Ir a mi Dashboard
        </button>
      </div>
    </div>
  )
}
