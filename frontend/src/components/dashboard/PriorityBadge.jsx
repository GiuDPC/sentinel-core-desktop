import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../constants/ticket'

const PRIORITY_DOT_COLORS = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-warning',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-danger',
}

export default function PriorityBadge({ priority, size = 'md' }) {
  const label = PRIORITY_LABELS[priority] || priority
  const textColor = PRIORITY_COLORS[priority] || 'text-slate-500'
  const dotColor = PRIORITY_DOT_COLORS[priority] || 'bg-slate-400'
  
  const sizeClasses = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5 mr-1.5' : 'h-2 w-2 mr-2'

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider ${sizeClasses} ${textColor}`}>
      <span className={`rounded-full ${dotSize} ${dotColor}`} />
      {label}
    </span>
  )
}
