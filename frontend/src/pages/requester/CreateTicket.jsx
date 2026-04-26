import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { categoriesApi } from '../../api/categories'
import notifications from '../../components/ui/Notifications'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Bajo', description: 'No interfiere operaciones criticas. Sin riesgo inmediato.' },
  { value: 'MEDIUM', label: 'Medio', description: 'Interrupcion parcial, afecta productividad de un area.' },
  { value: 'HIGH', label: 'Alto', description: 'Interrupcion significativa. Mayor de seguridad o perdida.' },
  { value: 'CRITICAL', label: 'Critico', description: 'Cese total de actividades. Mayor de seguridad o perdida.' },
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
      const list = Array.isArray(data) ? data : (data.data || data.categories || [])
      setCategories(list)
    } catch (error) {
      console.error('Error cargando categorias:', error)
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
      notifications.success('Tu reporte ha sido creado exitosamente', 'Reporte Creado')
      navigate('/requester/my-tickets')
    } catch (error) {
      notifications.error(error.message || 'No se pudo crear el reporte', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find((c) => String(c.id) === form.categoryId)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <nav className="text-xs text-text-secondary mb-1">
            Inicio &gt; Mis Tickets &gt; Nuevo Reporte
          </nav>
          <h2 className="text-2xl font-bold text-text-primary font-display">Crear Reporte de Incidencia</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/requester/dashboard')}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            form="create-ticket-form"
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Enviando...' : 'Enviar Reporte'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form id="create-ticket-form" onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl p-6 shadow-sm space-y-5">
            {/* Titulo */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Asunto del Reporte
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Fallo electrico en luminarias sector B"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            {/* Categoria y Ubicacion en fila */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Categoria
                </label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                >
                  <option value="">Seleccione una categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Ubicacion Detallada
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Ej: Planta 2, Pasillo Norte"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Descripcion */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Descripcion Detallada
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describa el incidente con el mayor detalle posible..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
              />
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nivel de Impacto
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {PRIORITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
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
                    <span className={`text-sm font-semibold ${
                      form.priority === opt.value ? 'text-accent' : 'text-text-primary'
                    }`}>{opt.label}</span>
                    <span className="text-[11px] text-text-secondary mt-1 leading-tight">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Panel lateral */}
        <div className="space-y-4">
          {selectedCategory && (
            <div className="bg-surface rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-text-primary font-display">
                  Compromiso SLA
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Tiempo de Respuesta</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">{selectedCategory.slaHours} Horas</p>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Para la categoria seleccionada, nuestro equipo tecnico garantiza una intervencion en sitio en plazo de {selectedCategory.slaHours} horas habiles.
                </p>
              </div>
            </div>
          )}

          <div className="bg-surface rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm9.303-3.376c-.866 1.5.217 3.374 1.948 3.374h-14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              <h3 className="text-sm font-semibold text-text-primary font-display">
                Consejos de Seguridad
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                No manipule cables o tableros electricos sin proteccion.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Aleje equipos electronicos de zonas con humedad o filtraciones.
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Senalice el area afectada para prevenir accidentes.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
