import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-danger font-display">403</h1>
        <p className="text-xl text-text-primary mt-4">Acceso no autorizado</p>
        <p className="text-text-secondary mt-2">
          No tienes permisos para acceder a esta seccion
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
