import { AuthContent } from './AuthContent'
import logo from '../../assets/logo.png'

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-linear-to-b from-white to-[#8FA4BF] overflow-hidden relative">
      <div className="w-full flex flex-col items-center justify-center p-4 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-[20px] px-10 py-10 w-full max-w-[520px]">
          <AuthContent>
            <img 
              src={logo} 
              alt="SentinelCore" 
              className="w-20 h-auto mb-4 drop-shadow-md"
            />
            {children}
          </AuthContent>
        </div>
      </div>
    </div>
  )
}
