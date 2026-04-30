import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Contexts/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import SigninForm from '../components/auth/SigninForm'
import notifications from '../components/ui/Notifications'

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, register, getDashboardPath } = useAuth()

  async function handleLogin(formData) {
    setLoading(true)
    try {
      const data = await login(formData)
      notifications.success('Bienvenido de vuelta', 'Sesion iniciada')
      // Usar el rol del response directamente porque getDashboardPath() lee state viejo
      const role = data.user?.role || data.role
      const dashPaths = { ADMIN: '/admin/dashboard', TECHNICIAN: '/technician/dashboard', REQUESTER: '/requester/dashboard' }
      navigate(dashPaths[role] || '/login')
    } catch (error) {
      console.error('Login:', error)
      notifications.error(error.message || 'Credenciales invalidas', 'Error de autenticacion')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(formData) {
    setLoading(true)
    try {
      await register(formData)
      notifications.success('Tu cuenta ha sido creada exitosamente', '¡Bienvenido!')
      // Requester por defecto — redirige a su dashboard
      navigate(getDashboardPath())
    } catch (error) {
      console.error('Registro:', error)
      notifications.error(error.message || 'No se pudo crear la cuenta', 'Error de registro')
    } finally {
      setLoading(false)
    }
  }

  function handleSwitch(e) {
    e?.preventDefault()
    setShowRegister(!showRegister)
  }

  return (
    <AuthLayout>
      <div className="w-full flex flex-col items-center">
        <h1 className="font-display text-3xl font-bold text-center text-blue-950 mb-6">
          SentinelCore
        </h1>
        
        {showRegister ? (
          <SigninForm onSubmit={handleRegister} onSwitchToLogin={handleSwitch} loading={loading} />
        ) : (
          <LoginForm onSubmit={handleLogin} onSwitchToRegister={handleSwitch} loading={loading} />
        )}
      </div>
    </AuthLayout>
  )
}