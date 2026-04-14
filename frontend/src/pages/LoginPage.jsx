import { useState } from 'react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { LoginForm } from '../components/auth/LoginForm'
import { SigninForm } from '../components/auth/SigninForm'

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(formData) {
    setLoading(true)
    console.log('Login:', formData)
    // await api.login(formData)
    setLoading(false)
  }

  async function handleRegister(formData) {
    setLoading(true)
    console.log('Registro:', formData)
    // await api.register(formData)
    setLoading(false)
  }

  function handleSwitch(e) {
    e?.preventDefault()
    setShowRegister(!showRegister)
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-center text-[#001b52] mb-8">
          {showRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
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