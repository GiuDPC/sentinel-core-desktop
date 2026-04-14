export function AuthPanel() {
  return (
    <div className="hidden md:flex md:w-[660px] md:h-[720px] md:ml-8 md:mt-8 bg-gradient-to-b from-[#82aaff] via-[#062238] to-[#010b14] flex-col justify-end items-center p-12 text-white rounded-3xl relative overflow-hidden">
      
      {/* Semicírculo blanco con fade desde top */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-white/20 blur-[120px] pointer-events-none" />
      <div className="absolute -top-[250px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px] pointer-events-none" />
      
      {/* Círculos decorativos con blur (orbs) */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full bg-blue-400/20 blur-[100px] animate-pulse" />
      <div className="absolute top-[100px] right-[-50px] w-[200px] h-[200px] rounded-full bg-blue-300/15 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[200px] left-[50px] w-[150px] h-[150px] rounded-full bg-indigo-400/20 blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Grid pattern sutil */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Partículas flotantes */}
      <div className="absolute top-16 left-20 w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute top-32 right-24 w-1.5 h-1.5 rounded-full bg-blue-300/50 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      <div className="absolute top-48 left-40 w-1 h-1 rounded-full bg-white/30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-24 right-32 w-1 h-1 rounded-full bg-blue-200/40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
      <div className="absolute bottom-48 left-16 w-1.5 h-1.5 rounded-full bg-indigo-300/50 animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }} />
      <div className="absolute top-36 left-1/2 w-1 h-1 rounded-full bg-white/50 animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '1.2s' }} />
      
      <div className="max-w-md text-left mb-6 relative z-10">
        <h1 className="font-display text-5xl font-extrabold mb-3 tracking-tight leading-tight">
          <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Sentinel</span>
          <span className="text-white">Core</span>
        </h1>
        <p className="font-body text-sm text-white/60 leading-relaxed text-justify tracking-normal">
          Plataforma empresarial de última generación para la gestión integral de tickets e incidencias. 
          Agiliza procesos, optimiza recursos y garantiza la excelencia operativa de tu organización.
        </p>
      </div>

      <div className="flex gap-4 w-full max-w-md relative z-10">
        <div className="group relative flex-1 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03] group-hover:bg-white/[0.06] transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <h3 className="font-body text-sm font-semibold mb-1 text-white/90 tracking-tight">Gestión</h3>
            <p className="font-body text-xs text-white/50 group-hover:text-white/70 transition-colors duration-300 tracking-wider">Control total</p>
          </div>
        </div>

        <div className="group relative flex-1 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03] group-hover:bg-white/[0.06] transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="font-body text-sm font-semibold mb-1 text-white/90 tracking-tight">Tiempo</h3>
            <p className="font-body text-xs text-white/50 group-hover:text-white/70 transition-colors duration-300 tracking-wider">SLA</p>
          </div>
        </div>

        <div className="group relative flex-1 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03] group-hover:bg-white/[0.06] transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h3 className="font-body text-sm font-semibold mb-1 text-white/90 tracking-tight">Seguridad</h3>
            <p className="font-body text-xs text-white/50 group-hover:text-white/70 transition-colors duration-300 tracking-wider">Acceso</p>
          </div>
        </div>
      </div>
    </div>
  )
}