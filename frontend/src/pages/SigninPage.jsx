import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Contexts/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'
import SigninForm from '../components/auth/SigninForm'
import notifications from '../components/ui/Notifications'

export default function SigninPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  async function handleRegister(formData) {
    setLoading(true)
    try {
      await register(formData)
      notifications.success('Tu cuenta ha sido creada exitosamente', '¡Bienvenido!')
      navigate('/')
    } catch (error) {
      console.error('Registro:', error)
      notifications.error(error.message || 'No se pudo crear la cuenta', 'Error de registro')
    } finally {
      setLoading(false)
    }
  }

  function handleSwitchToLogin(e) {
    e.preventDefault()
    navigate('/login')
  }

  return (
    <AuthLayout>
      <div className="w-full flex flex-col items-center">
        <h1 className="font-display text-3xl font-bold text-center text-[#001b52] mb-6">SentinelCore</h1>
        <SigninForm onSubmit={handleRegister} onSwitchToLogin={handleSwitchToLogin} loading={loading} />
      </div>
    </AuthLayout>
  )
}
