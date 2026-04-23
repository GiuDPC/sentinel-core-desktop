import { useState, useEffect } from 'react'
import { categoriesApi } from '../../api/categories'

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data.data || data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const deptLabels = {
    MANTENIMIENTO_ELECTRICO: 'Mtto. Eléctrico',
    PLOMERIA: 'Plomería', SEGURIDAD: 'Seguridad',
    INFRAESTRUCTURA: 'Infraestructura',
    REDES_Y_TELECOMUNICACIONES: 'Redes',
    ADMINISTRACION: 'Admin', OTROS: 'Otros',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">Categorías</h2>
        <p className="text-sm text-text-secondary mt-1">Categorías de incidencias y SLA</p>
      </div>
      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Departamento</th>
                <th className="px-6 py-4 font-medium">SLA</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-background/30 transition-colors">
                  <td className="px-6 py-4 text-text-primary font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{deptLabels[c.department] || c.department}</td>
                  <td className="px-6 py-4"><span className="font-bold text-accent">{c.slaHours}h</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {c.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
