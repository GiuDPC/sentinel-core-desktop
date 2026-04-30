const STATUS_CONFIG = {
  OPEN: { 
    label: 'Abierto', 
    color: 'text-slate-500 border-slate-200',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
  },
  ASSIGNED: { 
    label: 'Asignado', 
    color: 'text-blue-600 border-blue-200',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  },
  IN_PROGRESS: { 
    label: 'En Proceso', 
    color: 'text-indigo-600 border-indigo-300',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
  ON_HOLD: { 
    label: 'En Espera', 
    color: 'text-amber-600 border-amber-200 border-dashed',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  RESOLVED: { 
    label: 'Resuelto', 
    color: 'text-blue-900 border-blue-200',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  AWAITING_CONFIRMATION: { 
    label: 'Por Confirmar', 
    color: 'text-indigo-800 border-indigo-400',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 114 0" /></svg>
  },
  CLOSED: { 
    label: 'Cerrado', 
    color: 'text-slate-400 border-slate-200',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  },
}

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || { 
    label: status, 
    color: 'text-slate-400 border-slate-200',
    icon: (cls) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }
  
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  const iconClasses = size === 'sm' ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'

  return (
    <span className={`inline-flex items-center font-bold whitespace-nowrap transition-all ${sizeClasses} ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
      {config.icon(iconClasses)}
      {config.label}
    </span>
  )
}
