// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import PlayingNext from './PlayingNext'
import type { ShowEvent } from '../../data/events'
import type { Run } from '../../data/writeup'

afterEach(cleanup)

const event: ShowEvent = {
  id: 'e1',
  name: 'Hamilton',
  date: '2026-11-14',
  time: '19:30:00',
  url: 'https://www.ticketmaster.com/e1',
  venue: 'Richard Rodgers Theatre',
  city: 'New York',
  state: 'NY',
}
const run: Run = {
  name: 'National Tour',
  venue: 'Hobby Center',
  city: 'Houston',
  start: '2027-01-05',
  end: '2027-01-24',
  ticket_url: 'https://example.com/tour',
  source: 'https://example.com/source',
  checked: '2026-10-01',
}
const official = 'https://hamiltonmusical.com'

describe('PlayingNext', () => {
  it('orders Ticketmaster dates, curated runs, then the official link', () => {
    render(<PlayingNext state="ok" events={[event]} runs={[run]} officialUrl={official} />)
    const links = screen.getAllByRole('link')
    expect(links.map(l => l.getAttribute('href'))).toEqual([event.url, run.ticket_url, official])
    expect(screen.getByText('Dates from Ticketmaster')).toBeTruthy()
    expect(screen.getByText('Houston', { exact: false }).textContent).toContain('Hobby Center')
  })

  it('opens every link off-site safely, with an accessible name', () => {
    render(<PlayingNext state="ok" events={[event]} runs={[run]} officialUrl={official} />)
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toContain('noopener')
      expect(a.textContent).toContain('(opens in a new tab)')
    }
    const t = screen.getByRole('link', { name: /Tickets for Sat, Nov 14, 2026 at Richard Rodgers Theatre/ })
    expect(t.getAttribute('href')).toBe(event.url)
  })

  it('formats the local date and time without a timezone shift', () => {
    const original = process.env.TZ
    process.env.TZ = 'Pacific/Kiritimati'
    try {
      render(<PlayingNext state="ok" events={[{ ...event, date: '2026-01-01', time: '00:05:00' }]} runs={[]} />)
      expect(screen.getByText('Thu, Jan 1, 2026 · 12:05 AM')).toBeTruthy()
    } finally {
      process.env.TZ = original
    }
    cleanup()
    render(<PlayingNext state="ok" events={[event]} runs={[]} />)
    expect(screen.getByText('Sat, Nov 14, 2026 · 7:30 PM')).toBeTruthy()
    expect(screen.getByText('Richard Rodgers Theatre, New York, NY')).toBeTruthy()
  })

  it('still shows runs and the official link when live dates are unavailable', () => {
    render(<PlayingNext state="unavailable" events={[]} runs={[run]} officialUrl={official} />)
    expect(screen.getByText('Live dates are unavailable right now.')).toBeTruthy()
    expect(screen.queryByText('Dates from Ticketmaster')).toBeNull()
    expect(screen.getAllByRole('link').map(l => l.getAttribute('href'))).toEqual([run.ticket_url, official])
  })

  it('says so when Ticketmaster has no dates', () => {
    render(<PlayingNext state="ok" events={[]} runs={[]} officialUrl={official} />)
    expect(screen.getByText('No upcoming dates found on Ticketmaster.')).toBeTruthy()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('shows a loading note, and renders even with nothing at all', () => {
    const { unmount } = render(<PlayingNext state="loading" events={[]} runs={[]} />)
    expect(screen.getByText('Checking live dates…')).toBeTruthy()
    unmount()
    render(<PlayingNext state="unavailable" events={[]} runs={[]} />)
    expect(screen.getByRole('heading', { name: 'Playing next' })).toBeTruthy()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})
