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
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const backdropRef = useRef(null)

  useEffect(() => {
    if (show) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
    } else if (visible) {
      setAnimating(false)
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, 200) // duration matches CSS transition
      return () => clearTimeout(timer)
    }
  }, [show])

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
        className={`transition-all duration-200 ease-out ${
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
