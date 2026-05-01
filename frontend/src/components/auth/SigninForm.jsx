import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export default function SigninForm({ onSubmit, loading: externalLoading, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    storeNumber: '',
    storeName: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function handleStoreNumberChange(value) {
    let val = value.toUpperCase()
    if (!val.startsWith('L-')) {
      val = 'L-' + val.replace(/\D/g, '')
    } else {
      const rest = val.slice(2).replace(/\D/g, '')
      val = 'L-' + rest
    }
    handleChange('storeNumber', val)
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length !== 11) return false
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
    
    if (!formData.storeNumber.trim()) {
      newErrors.storeNumber = 'El número de local es requerido'
    } else if (!/^L-\d+$/.test(formData.storeNumber)) {
      newErrors.storeNumber = 'Formato inválido (Ej: L-105)'
    }

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'El nombre del local es requerido'
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
    onSubmit(formData)
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
          type="text"
          name="storeNumber"
          label="Número de Local"
          placeholder="Ej: L-105"
          value={formData.storeNumber}
          onChange={handleStoreNumberChange}
          onFocus={() => { if(!formData.storeNumber) handleStoreNumberChange('L-') }}
          error={errors.storeNumber}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="tel"
          name="phone"
          label="Teléfono"
          placeholder="0412-123-4567"
          value={formData.phone}
          onChange={(value) => handleChange('phone', formatPhone(value))}
          error={errors.phone}
        />
        <Input
          type="text"
          name="storeName"
          label="Nombre del Local"
          placeholder="Ej: Nike Store"
          value={formData.storeName}
          onChange={(value) => handleChange('storeName', value)}
          error={errors.storeName}
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
          label="Confirmar contraseña"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          error={errors.confirmPassword}
        />
      </div>
      
      <Button
        type="submit"
        loading={isLoading}
        className="mt-2 flex items-center justify-center gap-2"
      >
        <UserPlus size={20} className="stroke-white" />
        <span>Registrarse</span>
      </Button>

      <p className="text-center text-sm text-slate-500 mt-4">
        ¿Ya tenés cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-950 font-bold hover:underline cursor-pointer"
        >
          Iniciar sesión
        </button>
      </p>
    </form>
  )
}