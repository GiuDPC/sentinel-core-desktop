import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export default function LoginForm({ onSubmit, onSwitchToRegister, loading }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo electrónico válido'
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit?.({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
    })
  }

  function handleSwitch(e) {
    e?.preventDefault()
    onSwitchToRegister?.()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <Input
        type="email"
        name="email"
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        value={formData.email}
        onChange={(value) => handleChange('email', value)}
        error={errors.email}
      />

      <Input
        type="password"
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        value={formData.password}
        onChange={(value) => handleChange('password', value)}
        error={errors.password}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={(e) => handleChange('rememberMe', e.target.checked)}
            className="w-4 h-4 text-[#002570] border-gray-300 border rounded focus:ring-[#003091]/20"
          />
          <span className="font-body text-sm text-gray-600">Recordarme</span>
        </label>
        
        <button 
          type="button" 
          className="font-body text-sm text-blue-950 hover:underline focus:outline-none focus:ring-2 focus:ring-[#003091]/20 rounded"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <Button type="submit" loading={loading} className="mt-3 flex items-center justify-center gap-2">
        <LogIn size={20} className="stroke-white" />
        <span>Iniciar Sesión</span>
      </Button>

      <div className="text-center font-body text-sm text-gray-500 mt-2">
        ¿No tienes una cuenta?{' '}
        <button 
          type="button"
          onClick={handleSwitch}
          className="text-[#001c53] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[#003091]/20 rounded"
        >
          Regístrate
        </button>
      </div>
    </form>
  )
}