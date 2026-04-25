import { Navigate } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Ruta protegida por autenticación y roles.
 * @param {Object} props
 * @param {React.ReactNode} props.children — Contenido protegido
 * @param {string[]} [props.allowedRoles] — Roles permitidos (omitir = cualquier autenticado)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, hasRole } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
