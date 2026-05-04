const STATUS_CONFIG = {
  OPEN: { 
    label: 'Abierto', 
    color: 'text-slate-500 border-slate-200',
    dot: 'bg-slate-400'
  },
  ASSIGNED: { 
    label: 'Asignado', 
    color: 'text-blue-600 border-blue-200',
    dot: 'bg-blue-600'
  },
  IN_PROGRESS: { 
    label: 'En Proceso', 
    color: 'text-indigo-600 border-indigo-300',
    dot: 'bg-indigo-600'
  },
  ON_HOLD: { 
    label: 'En Espera', 
    color: 'text-amber-600 border-amber-200 border-dashed',
    dot: 'bg-amber-600'
  },
  RESOLVED: { 
    label: 'Resuelto', 
    color: 'text-blue-900 border-blue-200',
    dot: 'bg-blue-900'
  },
  AWAITING_CONFIRMATION: { 
    label: 'Por Confirmar', 
    color: 'text-indigo-800 border-indigo-400',
    dot: 'bg-indigo-800'
  },
  CLOSED: { 
    label: 'Cerrado', 
    color: 'text-slate-400 border-slate-200',
    dot: 'bg-slate-300'
  },
}

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || { 
    label: status, 
    color: 'text-slate-400 border-slate-200',
    dot: 'bg-slate-400'
  }
  
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  const dotClasses = size === 'sm' ? 'h-1.5 w-1.5 mr-1.5' : 'h-2 w-2 mr-2'

  return (
    <span className={`inline-flex items-center font-bold whitespace-nowrap transition-all ${sizeClasses} ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
      <span className={`rounded-full ${dotClasses} ${config.dot}`} />
      {config.label}
    </span>
  )
}

