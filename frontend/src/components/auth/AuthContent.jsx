import { useState, useEffect } from 'react'

export function AuthContent({ children }) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShouldAnimate(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      className={`
        flex flex-col items-center w-full
        transition-all duration-300 ease-out
        ${shouldAnimate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
    >
      {children}
    </div>
  )
}