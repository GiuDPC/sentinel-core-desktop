import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KPICard from '../../components/dashboard/KPICard'

describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Total Tickets" value={26} />)
    expect(screen.getByText('Total Tickets')).toBeInTheDocument()
    expect(screen.getByText('26')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<KPICard title="SLA" value={0} subtitle="5 en riesgo" />)
    expect(screen.getByText('5 en riesgo')).toBeInTheDocument()
  })

  it('renders trend info when provided', () => {
    render(<KPICard title="Open" value={5} trend="up" trendValue="12%" />)
    expect(screen.getByText(/12%/)).toBeInTheDocument()
  })

  it('does not render any emoji characters', () => {
    const { container } = render(
      <KPICard title="Test" value={10} subtitle="sub" trend="up" trendValue="5%" color="red" />
    )
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(container.textContent).not.toMatch(emojiRegex)
  })

  it('applies color indicator dot', () => {
    const { container } = render(<KPICard title="T" value={0} color="red" />)
    const dot = container.querySelector('.rounded-full')
    expect(dot).toBeInTheDocument()
  })
})