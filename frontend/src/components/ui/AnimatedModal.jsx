import { useState, useEffect, useRef } from 'react'

export default function AnimatedModal({ show, onClose, children, className = '' }) {
  const [visible, setVisible] = useState(show)
  const [animating, setAnimating] = useState(show)
  const [prevShow, setPrevShow] = useState(show)
  const backdropRef = useRef(null)

  const ANIM_DURATION = 400

  if (show !== prevShow) {
    setPrevShow(show)
    if (show) {
      setVisible(true)
      setAnimating(false)
    } else {
      setAnimating(false)
    }
  }

  useEffect(() => {
    let timer;
    if (show && visible && !animating) {
      timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    } else if (!show && visible) {
      timer = setTimeout(() => {
        setVisible(false)
      }, ANIM_DURATION)
    }
    
    return () => {
      if (typeof timer === 'number') {
        clearTimeout(timer)
        cancelAnimationFrame(timer)
      }
    }
  }, [show, visible, animating])

  if (!visible) return null

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) {
      onClose?.()
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-[400ms] ease-out ${
        animating ? 'bg-slate-900/50' : 'bg-transparent'
      }`}
    >
      <div
        className={`max-h-[90vh] origin-center will-change-transform transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] ${
          animating
            ? 'opacity-100 scale-100 translate-y-0 drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)]'
            : 'opacity-0 scale-[0.95] translate-y-4 drop-shadow-none'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  )
}