import { AuthPanel } from './AuthPanel'
import { AuthContent } from './AuthContent'
import logo from '../../assets/logo.png'

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
      <AuthPanel />
      
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 bg-white">
        <AuthContent>
          <img 
            src={logo} 
            alt="SentinelCore" 
            className="w-20 h-auto mb-4"
          />
          {children}
        </AuthContent>
      </div>
    </div>
  )
}
