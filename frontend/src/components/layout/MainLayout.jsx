import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

/**
 * Shell principal de la aplicación: Sidebar + Header + contenido.
 * Envuelve todas las rutas protegidas del dashboard.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 py-2 pr-2 pl-0">
        <div className="relative flex flex-1 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Header />
          <main className="flex-1 p-4 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
