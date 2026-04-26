import { useState, useEffect } from 'react'

import { useAuth } from '../Contexts/AuthContext'
import { usersApi } from '../api/users'
import { authApi } from '../api/auth'
import notifications from '../components/ui/Notifications'

// Validación de teléfono venezolano
const phoneRegex = /^04(12|14|16|24|26)-\d{3}-\d{4}$/

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  

  // Sincronizar form con user cuando cambia
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  })
  
  // Sincronizar cuando user carga inicialmente o se actualiza globalmente
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      })
    }
  }, [user])
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  
  const [errors, setErrors] = useState({})
  
  // Filtrar solo letras para nombre/apellido
  function filterLettersOnly(value) {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
  }
  
  function handleFirstNameChange(e) {
    const filtered = filterLettersOnly(e.target.value)
    setForm(f => ({ ...f, firstName: filtered }))
    // Validar en tiempo real
    if (filtered.length > 0 && filtered.length < 2) {
      setErrors(e => ({ ...e, firstName: 'Mínimo 2 letras' }))
    } else if (filtered.length > 0 && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(filtered)) {
      setErrors(e => ({ ...e, firstName: 'Solo letras permitidas' }))
    } else {
      setErrors(e => ({ ...e, firstName: null }))
    }
  }
  
  function handleLastNameChange(e) {
    const filtered = filterLettersOnly(e.target.value)
    setForm(f => ({ ...f, lastName: filtered }))
    // Validar en tiempo real
    if (filtered.length > 0 && filtered.length < 2) {
      setErrors(e => ({ ...e, lastName: 'Mínimo 2 letras' }))
    } else if (filtered.length > 0 && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(filtered)) {
      setErrors(e => ({ ...e, lastName: 'Solo letras permitidas' }))
    } else {
      setErrors(e => ({ ...e, lastName: null }))
    }
  }
  
  // Formatear teléfono automáticamente
  function handlePhoneChange(e) {
    let value = e.target.value.replace(/\D/g, '') // Solo números
    
    // Auto-formato: 0412-123-4567
    if (value.length > 4 && value.length <= 7) {
      value = `${value.slice(0, 4)}-${value.slice(4)}`
    } else if (value.length > 7) {
      value = `${value.slice(0, 4)}-${value.slice(4, 7)}-${value.slice(7, 11)}`
    }
    
    setForm(f => ({ ...f, phone: value }))
    
    // Validar en tiempo real
    if (value.length > 0 && value.length < 13) {
      setErrors(e => ({ ...e, phone: 'Teléfono incompleto' }))
    } else if (value.length === 13 && !phoneRegex.test(value)) {
      setErrors(e => ({ ...e, phone: 'Formato: 0412-123-4567' }))
    } else {
      setErrors(e => ({ ...e, phone: null }))
    }
  }
  
  // Validar formulario antes de enviar
  function validateProfile() {
    const newErrors = {}
    
    if (!form.firstName || form.firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 letras'
    }
    if (!form.lastName || form.lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 letras'
    }
    if (form.phone && !phoneRegex.test(form.phone)) {
      newErrors.phone = 'Teléfono debe ser 0412-123-4567'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Validar formulario de contraseña
  function validatePassword() {
    const newErrors = {}
    if (!passwordForm.currentPassword || passwordForm.currentPassword.length < 8) {
      newErrors.currentPassword = 'Mínimo 8 caracteres'
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Mínimo 8 caracteres'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      newErrors.newPassword = 'Debe ser diferente a la actual'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  async function handleSaveProfile() {
    if (!validateProfile()) return
    
    setSavingProfile(true)
    try {
      const response = await usersApi.updateProfile(form)
      
      // Verificar estructura de respuesta
      if (!response || !response.user) {
        console.error('Invalid response:', response)
        notifications.error('Error al guardar: respuesta inválida', 'Error')
        return
      }
      
      // Actualizar usuario en el context
      updateUser(response.user)
      

      // Actualizar el formulario con los nuevos datos
      setForm({
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        phone: response.user.phone || '',
      })
      
      setIsEditing(false)
      setErrors({})
      notifications.success('Perfil actualizado correctamente', 'Guardado')
      
    } catch (error) {
      console.error('Error saving profile:', error)
      notifications.error(error.message || 'Error al guardar', 'Error')
    } finally {
      setSavingProfile(false)
    }
  }
  
  async function handleChangePassword() {
    if (!validatePassword()) return
    
    setSavingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setIsChangingPassword(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
      notifications.success('Contraseña actualizada correctamente', 'Cambiada')
    } catch (error) {
      console.error('Error changing password:', error)
      notifications.error(error.message || 'Error al cambiar contraseña', 'Error')
    } finally {
      setSavingPassword(false)
    }
  }
  
  function handleCancelEdit() {
    // Restaurar valores originales del user
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    })
    setIsEditing(false)
    setErrors(e => {
      const newErrors = { ...e }
      delete newErrors.firstName
      delete newErrors.lastName
      delete newErrors.phone
      return newErrors
    })
  }
  
  const roleLabels = {
    ADMIN: 'Administrador',
    TECHNICIAN: 'Técnico',
    REQUESTER: 'Locatario',
  }
  
  // Si no hay usuario, mostrar loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Cargando...</div>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">
            Mi Perfil
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {roleLabels[user?.role] || user?.role}
          </p>
        </div>
      </div>
      
      {/* Información del perfil */}
      <div className="bg-surface rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary font-display">
            Información Personal
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg hover:bg-background transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {savingProfile ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Nombre
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleFirstNameChange}
                  placeholder="Solo letras"
                  className={`w-full px-4 py-2 bg-background border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 ${errors.firstName ? 'border-danger' : 'border-border'}`}
                />
                {errors.firstName && (
                  <p className="text-xs text-danger mt-1">{errors.firstName}</p>
                )}
              </>
            ) : (
              <p className="text-text-primary">{user.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Apellido
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleLastNameChange}
                  placeholder="Solo letras"
                  className={`w-full px-4 py-2 bg-background border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 ${errors.lastName ? 'border-danger' : 'border-border'}`}
                />
                {errors.lastName && (
                  <p className="text-xs text-danger mt-1">{errors.lastName}</p>
                )}
              </>
            ) : (
              <p className="text-text-primary">{user.lastName}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Teléfono
            </label>
            {isEditing ? (
              <>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="0412-123-4567"
                  maxLength={13}
                  className={`w-full px-4 py-2 bg-background border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 ${errors.phone ? 'border-danger' : 'border-border'}`}
                />
                {errors.phone && (
                  <p className="text-xs text-danger mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-text-secondary mt-1">Formato: 0412-123-4567</p>
              </>
            ) : (
              <p className="text-text-primary">{user.phone || 'No registrado'}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Correo Electrónico
            </label>
            <p className="text-text-secondary">{user.email}</p>
          </div>
        </div>
      </div>
      
      {/* Cambiar contraseña */}
      <div className="bg-surface rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary font-display">
            Seguridad
          </h3>
          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 text-sm border border-border text-text-secondary rounded-lg hover:bg-background transition-colors cursor-pointer"
            >
              Cambiar Contraseña
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setErrors(e => {
                    const newErrors = { ...e }
                    delete newErrors.currentPassword
                    delete newErrors.newPassword
                    delete newErrors.confirmPassword
                    return newErrors
                  })
                }}
                className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg hover:bg-background transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {savingPassword ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
        
        {isChangingPassword && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                className={`w-full px-4 py-2 bg-background border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 ${errors.currentPassword ? 'border-danger' : 'border-border'}`}
              />
              {errors.currentPassword && (
                <p className="text-xs text-danger mt-1">{errors.currentPassword}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className={`w-full px-4 py-2 bg-background border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 ${errors.newPassword ? 'border-danger' : 'border-border'}`}
              />
              {errors.newPassword && (
                <p className="text-xs text-danger mt-1">{errors.newPassword}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className={`w-full px-4 py-2 bg-background border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 ${errors.confirmPassword ? 'border-danger' : 'border-border'}`}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-danger mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        )}
        
        {!isChangingPassword && (
          <p className="text-sm text-text-secondary">
            Cambia tu contraseña regularmente para mantener tu cuenta segura.
          </p>
        )}
      </div>
      
      {/* Información adicional */}
      <div className="bg-surface rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary font-display mb-4">
          Información de la Cuenta
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Rol</span>
            <span className="text-text-primary font-medium">{roleLabels[user?.role] || user?.role}</span>
          </div>
          {user?.department && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Departamento</span>
              <span className="text-text-primary font-medium">{user.department}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}