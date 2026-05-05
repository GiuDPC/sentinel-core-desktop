import { useState, useEffect, useRef } from 'react'

/**
 * Wrapper de animacion para modales y paneles overlay.
 * Maneja entrada con scale/fade y salida con fade-out suave.
 *
 * @param {Object} props
 * @param {boolean} props.show - Controla visibilidad del modal
 * @param {function} props.onClose - Callback al cerrar (despues de animacion)
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {string} [props.className] - Clases adicionales para el panel
 */
export default function AnimatedModal({ show, onClose, children, className = '' }) {
  const [visible, setVisible] = useState(show)
  const [animating, setAnimating] = useState(show)
  const [prevShow, setPrevShow] = useState(show)
  const backdropRef = useRef(null)

  // Derivar estado durante el render (React 18 Best Practice) para evitar el warning
  // de "Calling setState synchronously within an effect"
  if (show !== prevShow) {
    setPrevShow(show)
    if (show) {
      setVisible(true)
    } else {
      setAnimating(false)
    }
  }

  useEffect(() => {
    if (show) {
      // El componente ya es 'visible', disparamos la animación en el proximo frame
      const frame = requestAnimationFrame(() => setAnimating(true))
      return () => cancelAnimationFrame(frame)
    } else if (visible) {
      // La animación ya se desactivó en el render, esperamos 200ms y desmontamos
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, 200) // duration matches CSS transition
      return () => clearTimeout(timer)
    }
  }, [show, visible, onClose])

  if (!visible) return null

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) {
      setAnimating(false)
      setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, 200)
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        animating ? 'bg-black/50' : 'bg-black/0'
      }`}
    >
      <div
        className={`max-h-[90vh] transition-all duration-200 ease-out ${
          animating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
