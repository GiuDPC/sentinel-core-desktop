import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import QuickActions from '../../components/dashboard/QuickActions'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('QuickActions', () => {
  it('renders all quick action items', () => {
    renderWithRouter(<QuickActions />)
    expect(screen.getByText('Corte Eléctrico')).toBeInTheDocument()
    expect(screen.getByText('Incendio')).toBeInTheDocument()
    expect(screen.getByText('Fuga de Agua')).toBeInTheDocument()
    expect(screen.getByText('Falla de Red')).toBeInTheDocument()
  })

  it('renders descriptions for each action', () => {
    renderWithRouter(<QuickActions />)
    expect(screen.getByText('Fallas de luz o cortocircuitos')).toBeInTheDocument()
    expect(screen.getByText('Tuberias o filtraciones')).toBeInTheDocument()
  })

  it('does not contain emoji characters', () => {
    const { container } = renderWithRouter(<QuickActions />)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(container.textContent).not.toMatch(emojiRegex)
  })

  it('uses SVG icons instead of emojis', () => {
    const { container } = renderWithRouter(<QuickActions />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(8) // One SVG per action item
  })
})
