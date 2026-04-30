import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LiveTracker from '../../components/dashboard/LiveTracker'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('LiveTracker', () => {
  it('renders step labels', () => {
    renderWithRouter(<LiveTracker currentStatus="OPEN" />)
    expect(screen.getByText('Reportado')).toBeInTheDocument()
    expect(screen.getByText('Asignado')).toBeInTheDocument()
    expect(screen.getByText('En proceso')).toBeInTheDocument()
    expect(screen.getByText('Confirmacion')).toBeInTheDocument()
    expect(screen.getByText('Cerrado')).toBeInTheDocument()
  })

  it('renders ticket code when provided', () => {
    renderWithRouter(
      <LiveTracker
        currentStatus="IN_PROGRESS"
        ticketCode="TK-0001"
        title="Apagon parcial"
      />
    )
    expect(screen.getByText('#TK-0001')).toBeInTheDocument()
    expect(screen.getByText('Apagon parcial')).toBeInTheDocument()
  })

  it('renders technician name when provided', () => {
    renderWithRouter(
      <LiveTracker
        currentStatus="ASSIGNED"
        ticketCode="TK-0002"
        technicianName="Carlos Perez"
      />
    )
    expect(screen.getByText('Carlos Perez')).toBeInTheDocument()
  })

  it('does not contain emoji characters', () => {
    const { container } = renderWithRouter(
      <LiveTracker
        currentStatus="IN_PROGRESS"
        ticketCode="TK-0003"
        technicianName="Maria Lopez"
        eta="2h"
      />
    )
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(container.textContent).not.toMatch(emojiRegex)
  })

  it('renders SVG checkmark for completed steps', () => {
    const { container } = renderWithRouter(
      <LiveTracker currentStatus="IN_PROGRESS" />
    )
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })
})
