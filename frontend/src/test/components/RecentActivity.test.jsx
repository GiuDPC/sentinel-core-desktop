import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecentActivity from '../../components/dashboard/RecentActivity'

describe('RecentActivity', () => {
  it('renders empty state when no tickets', () => {
    render(<RecentActivity tickets={[]} />)
    expect(screen.getByText('Sin actividad reciente')).toBeInTheDocument()
  })

  it('renders tickets in table format', () => {
    const tickets = [
      {
        id: 1,
        ticketCode: 'TK-0001',
        title: 'Falla eléctrica',
        category: { name: 'Corte Electrico' },
        status: 'OPEN',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
      },
    ]
    render(<RecentActivity tickets={tickets} />)
    expect(screen.getByText('TK-0001')).toBeInTheDocument()
    expect(screen.getByText('Falla eléctrica')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    const tickets = [
      {
        id: 1,
        ticketCode: 'TK-0001',
        category: { name: 'Test' },
        status: 'OPEN',
        priority: 'LOW',
        createdAt: new Date().toISOString(),
      },
    ]
    render(<RecentActivity tickets={tickets} />)
    expect(screen.getByText('Código')).toBeInTheDocument()
  })

  it('does not contain emoji characters', () => {
    const tickets = [
      {
        id: 1,
        ticketCode: 'TK-0001',
        category: { name: 'Test' },
        status: 'OPEN',
        priority: 'LOW',
        createdAt: new Date().toISOString(),
      },
    ]
    const { container } = render(<RecentActivity tickets={tickets} />)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(container.textContent).not.toMatch(emojiRegex)
  })
})
