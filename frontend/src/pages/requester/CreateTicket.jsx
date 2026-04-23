import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { categoriesApi } from '../../api/categories'
import notifications from '../../components/ui/Notifications'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baja', description: 'No afecta operaciones' },
  { value: 'MEDIUM', label: 'Media', description: 'Afecta parcialmente' },
  { value: 'HIGH', label: 'Alta', description: 'Impacto significativo' },
  { value: 'CRITICAL', label: 'Crítica', description: 'Emergencia inmediata' },
]

export default function CreateTicket() {
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    categoryId: '',
    priority: 'MEDIUM',
  })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // Pre-seleccionar categoría desde QuickActions
    if (location.state?.preselectedCategory && categories.length > 0) {
      const cat = categories.find((c) => c.name === location.state.preselectedCategory)
      if (cat) {
        setForm((f) => ({ ...f, categoryId: String(cat.id) }))
      }
    }
  }, [location.state, categories])

  async function loadCategories() {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data.data || data || [])
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.title || !form.description || !form.location || !form.categoryId) {
      notifications.error('Todos los campos son obligatorios', 'Campos faltantes')
      return
    }

    setLoading(true)
    try {
      await ticketsApi.create({
        ...form,
        categoryId: parseInt(form.categoryId, 10),
      })
      notifications.success('Tu reporte ha sido creado exitosamente', '¡Reporte Creado!')
      navigate('/requester/my-tickets')
    } catch (error) {
      notifications.error(error.message || 'No se pudo crear el reporte', 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Buscar la categoría seleccionada para mostrar el SLA
  const selectedCategory = categories.find((c) => String(c.id) === form.categoryId)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary font-display">Nuevo Reporte</h2>
        <p className="text-sm text-text-secondary mt-1">
          Reporta una incidencia en el centro comercial
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl p-6 shadow-sm space-y-5">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Título del reporte *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Corte de luz en el local L-204"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Categoría *
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (SLA: {cat.slaHours}h)
                  </option>
                ))}
              </select>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Ubicación *
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Ej: Local L-204, Nivel 2"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Nivel de Impacto *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PRIORITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.priority === opt.value
                        ? 'border-accent bg-accent-light'
                        : 'border-border hover:border-accent/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={opt.value}
                      checked={form.priority === opt.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-text-primary">{opt.label}</span>
                    <span className="text-xs text-text-secondary">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Descripción detallada *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe el problema con la mayor cantidad de detalles posible..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Enviando...' : '📤 Enviar Reporte'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/requester/dashboard')}
              className="px-6 py-3 border border-border text-text-secondary font-medium rounded-lg hover:bg-background transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Panel lateral — Info SLA */}
        <div className="space-y-4">
          {selectedCategory && (
            <div className="bg-surface rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-3 font-display">
                📋 Información SLA
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-secondary">Categoría</p>
                  <p className="text-sm font-medium text-text-primary">{selectedCategory.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Tiempo máximo de resolución</p>
                  <p className="text-lg font-bold text-accent">{selectedCategory.slaHours} horas</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary mb-3 font-display">
              ℹ️ ¿Cómo funciona?
            </h3>
            <ol className="space-y-2 text-xs text-text-secondary">
              <li>1. Envías tu reporte</li>
              <li>2. Se asigna automáticamente una prioridad SLA</li>
              <li>3. Un técnico es asignado al caso</li>
              <li>4. Seguí el progreso en tu dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
