import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { SigninForm } from '../components/auth/SigninForm'

export default function SigninPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleRegister(formData) {
    setLoading(true)
    console.log('Registro:', formData)
    // Acá va la llamada al API
    // const response = await api.register(formData)
    // if (response.success) navigate('/dashboard')
    setLoading(false)
  }

  function handleSwitchToLogin(e) {
    e.preventDefault()
    navigate('/login')
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-center text-[#001b52] mb-8">Crear Cuenta</h1>
        <SigninForm onSubmit={handleRegister} onSwitchToLogin={handleSwitchToLogin} loading={loading} />
      </div>
    </AuthLayout>
  )
}