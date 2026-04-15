import { useEffect, useState } from 'react'

export function AuthContent({ children }) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    setShouldAnimate(true)
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
