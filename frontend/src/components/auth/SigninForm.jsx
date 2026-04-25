import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function SigninForm({ onSubmit, onSwitchToLogin, loading: externalLoading }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function formatPhone(value) {
    // Formato venezolano: 04XX-XXX-XXXX (11 dígitos)
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  function validatePhone(phone) {
    // Venezuela: 11 dígitos, prefijos válidos
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length !== 11) return false
    // Códigos: Digitel (0412), Movistar (0414, 0424), Movilnet (0416, 0426)
    const validPrefixes = ['0412', '0414', '0416', '0424', '0426']
    const prefix = cleanPhone.slice(0, 4)
    return validPrefixes.includes(prefix)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Mínimo 2 caracteres'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Mínimo 2 caracteres'
    }
    
    if (!formData.email) {
      newErrors.email = 'El correo es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Correo inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Formato venezolano inválido (04XX-XXX-XXXX)'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    onSubmit?.(formData)
    setLoading(false)
  }

  const isLoading = externalLoading ?? loading

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="text"
          name="firstName"
          label="Nombre"
          placeholder="Juan"
          value={formData.firstName}
          onChange={(value) => handleChange('firstName', value)}
          error={errors.firstName}
        />
        
        <Input
          type="text"
          name="lastName"
          label="Apellido"
          placeholder="Pérez"
          value={formData.lastName}
          onChange={(value) => handleChange('lastName', value)}
          error={errors.lastName}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
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
          type="tel"
          name="phone"
          label="Teléfono"
          placeholder="0412-123-4567"
          value={formData.phone}
          onChange={(value) => handleChange('phone', formatPhone(value))}
          error={errors.phone}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="password"
          name="password"
          label="Contraseña"
          placeholder="••••••••"
          value={formData.password}
          onChange={(value) => handleChange('password', value)}
          error={errors.password}
        />
        
        <Input
          type="password"
          name="confirmPassword"
          label="Confirmar"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          error={errors.confirmPassword}
        />
      </div>

      <Button type="submit" loading={isLoading} className="mt-1">
        Crear Cuenta
      </Button>

      <p className="font-body text-sm text-gray-500 text-center mt-1">
        ¿Ya tienes cuenta?{' '}
        <button 
          type="button"
          onClick={() => onSwitchToLogin?.()}
          className="font-semibold text-[#003091] hover:underline focus:outline-none focus:ring-2 focus:ring-[#003091]/20 rounded"
        >
          Inicia Sesión
        </button>
      </p>
    </form>
  )
}