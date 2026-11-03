/// <reference types="node" />
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
    render(<PlayingNext title="Hamilton" state="ok" events={[event]} runs={[run]} officialUrl={official} />)
    const links = screen.getAllByRole('link')
    expect(links.map(l => l.getAttribute('href'))).toEqual([event.url, run.ticket_url, official])
    expect(screen.getByText('Dates from Ticketmaster')).toBeTruthy()
    expect(screen.getByText('Houston', { exact: false }).textContent).toContain('Hobby Center')
  })

  it('opens every link off-site safely, with an accessible name', () => {
    render(<PlayingNext title="Hamilton" state="ok" events={[event]} runs={[run]} officialUrl={official} />)
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toContain('noopener')
      expect(a.textContent).toContain('(opens in a new tab)')
    }
    const t = screen.getByRole('link', { name: /Tickets for Sat, Nov 14, 2026 · 7:30 PM at Richard Rodgers Theatre/ })
    expect(t.getAttribute('href')).toBe(event.url)
  })

  it('formats the local date and time without a timezone shift', () => {
    const original = process.env.TZ
    process.env.TZ = 'Pacific/Kiritimati'
    try {
      render(<PlayingNext title="Hamilton" state="ok" events={[{ ...event, date: '2026-01-01', time: '00:05:00' }]} runs={[]} />)
      expect(screen.getByText('Thu, Jan 1, 2026 · 12:05 AM')).toBeTruthy()
    } finally {
      process.env.TZ = original
    }
    cleanup()
    render(<PlayingNext title="Hamilton" state="ok" events={[event]} runs={[]} />)
    expect(screen.getByText('Sat, Nov 14, 2026 · 7:30 PM')).toBeTruthy()
    expect(screen.getByText('Richard Rodgers Theatre, New York, NY')).toBeTruthy()
  })

  it('still shows runs and the official link when live dates are unavailable', () => {
    render(<PlayingNext title="Hamilton" state="unavailable" events={[]} runs={[run]} officialUrl={official} />)
    expect(screen.getByText('Live dates are unavailable right now.')).toBeTruthy()
    expect(screen.queryByText('Dates from Ticketmaster')).toBeNull()
    expect(screen.getAllByRole('link').map(l => l.getAttribute('href'))).toEqual([run.ticket_url, official])
  })

  it('says so when Ticketmaster has no dates', () => {
    render(<PlayingNext title="Hamilton" state="ok" events={[]} runs={[]} officialUrl={official} />)
    expect(screen.getByText('No upcoming dates found on Ticketmaster.')).toBeTruthy()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('shows a loading note, and renders even with nothing at all', () => {
    const { unmount } = render(<PlayingNext title="Hamilton" state="loading" events={[]} runs={[]} />)
    expect(screen.getByText('Checking live dates…')).toBeTruthy()
    unmount()
    render(<PlayingNext title="Hamilton" state="unavailable" events={[]} runs={[]} />)
    expect(screen.getByRole('heading', { name: 'Playing next' })).toBeTruthy()
    expect(screen.getAllByRole('link').map(l => l.getAttribute('href'))).toEqual(['https://www.ticketmaster.com/search?q=Hamilton'])
  })

  it('gives same-day shows distinct link names by including the time', () => {
    const evening = { ...event, id: 'e2', time: '20:00:00', url: 'https://www.ticketmaster.com/e2' }
    const matinee = { ...event, id: 'e3', time: '14:00:00', url: 'https://www.ticketmaster.com/e3' }
    render(<PlayingNext title="Hamilton" state="ok" events={[matinee, evening]} runs={[]} />)
    expect(screen.getByRole('link', { name: /Tickets for Sat, Nov 14, 2026 · 2:00 PM at/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Tickets for Sat, Nov 14, 2026 · 8:00 PM at/ })).toBeTruthy()
  })

  it('keeps one status line that reflects the state', () => {
    const { rerender } = render(<PlayingNext title="Hamilton" state="loading" events={[]} runs={[]} />)
    expect(screen.getByRole('status').textContent).toBe('Checking live dates…')
    rerender(<PlayingNext title="Hamilton" state="ok" events={[event]} runs={[]} />)
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status').textContent).toBe('1 upcoming date from Ticketmaster.')
  })

  it('drops finished runs and sorts the rest by start', () => {
    const mk = (name: string, start?: string, end?: string): Run => ({ ...run, name, ticket_url: `https://example.com/${name}`, start, end })
    const runs = [mk('Later', '2027-03-01', '2027-03-10'), mk('Done', '2026-01-01', '2026-02-01'), mk('Soon', '2026-11-01', '2026-11-30'), mk('Today', '2026-10-20', '2026-10-26')]
    render(<PlayingNext title="Hamilton" state="unavailable" events={[]} runs={runs} today="2026-10-26" />)
    const names = screen.getAllByRole('listitem').map(li => li.querySelector('p')?.textContent)
    expect(names).toEqual(['Today', 'Soon', 'Later'])
  })

  it('falls back to a Ticketmaster search link when there is no official link', () => {
    render(<PlayingNext title="Dear Evan Hansen & Co" state="unavailable" events={[]} runs={[]} />)
    const link = screen.getByRole('link', { name: /Search Ticketmaster for Dear Evan Hansen & Co/ })
    expect(link.getAttribute('href')).toBe('https://www.ticketmaster.com/search?q=Dear%20Evan%20Hansen%20%26%20Co')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.queryByRole('link', { name: /Official tickets/ })).toBeNull()
  })

  it('does not show the search fallback when there is an official link', () => {
    render(<PlayingNext title="Hamilton" state="ok" events={[]} runs={[]} officialUrl={official} />)
    expect(screen.queryByRole('link', { name: /Search Ticketmaster/ })).toBeNull()
  })
})
