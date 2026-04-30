import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../../components/dashboard/StatusBadge'

describe('StatusBadge', () => {
  it('renders OPEN status as "Abierto"', () => {
    render(<StatusBadge status="OPEN" />)
    expect(screen.getByText('Abierto')).toBeInTheDocument()
  })

  it('renders IN_PROGRESS status as "En Proceso"', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('En Proceso')).toBeInTheDocument()
  })

  it('renders RESOLVED status as "Resuelto"', () => {
    render(<StatusBadge status="RESOLVED" />)
    expect(screen.getByText('Resuelto')).toBeInTheDocument()
  })

  it('renders CLOSED status as "Cerrado"', () => {
    render(<StatusBadge status="CLOSED" />)
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('renders AWAITING_CONFIRMATION status as "Por Confirmar"', () => {
    render(<StatusBadge status="AWAITING_CONFIRMATION" />)
    expect(screen.getByText('Por Confirmar')).toBeInTheDocument()
  })

  it('does not contain emoji characters', () => {
    const { container } = render(<StatusBadge status="OPEN" />)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(container.textContent).not.toMatch(emojiRegex)
  })
})
