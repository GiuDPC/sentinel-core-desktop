import { Toaster as Sonner } from 'sonner'

/**
 * Componente Toaster global — wrapper de Sonner.
 * Renderizar UNA sola vez en la raíz del árbol (App.jsx o router).
 *
 * Props admitidas: las mismas que <Sonner /> (position, duration, etc.)
 */
export function Toaster(props) {
  return (
    <Sonner
      className="toaster group [&_div[data-content]]:w-full"
      style={{
        '--normal-bg': '#ffffff',
        '--normal-text': '#0f172a',
        '--normal-border': '#e2e8f0',
      }}
      {...props}
    />
  )
}
