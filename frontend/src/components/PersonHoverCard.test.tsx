// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { resetCatalogIndexCache } from '../data/catalogIndexCache'
import { resetPersonSummaryCache } from '../data/personSummary'
import PersonHoverCard from './PersonHoverCard'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  resetPersonSummaryCache()
  resetCatalogIndexCache()
})

const index = { meta: {}, shows: [{ slug: 'show-boat', title: 'Show Boat', year: '1927', creators: ['Jerome Kern'] }] }
const wikidata = { entities: { Q1: { sitelinks: { enwiki: { title: 'Jerome Kern' } }, descriptions: { en: { value: 'American composer' } } } } }
const summary = {
  title: 'Jerome Kern',
  extract: 'Kern was a composer. He wrote Show Boat. Third.',
  thumbnail: { source: 'https://upload.wikimedia.org/k.jpg' },
  content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Jerome_Kern' } },
}

function stub(failing: boolean) {
  vi.stubGlobal('fetch', async (url: string) => {
    if (failing) throw new TypeError('offline')
    const body = url.includes('/catalog/index.json') ? index : url.includes('wikidata') ? wikidata : summary
    return { ok: true, status: 200, json: async () => body }
  })
}

const renderCard = (href?: string) =>
  render(<MemoryRouter><PersonHoverCard name="Jerome Kern" qid="Q1" href={href} /></MemoryRouter>)

describe('PersonHoverCard', () => {
  it('opens on keyboard focus with description, known-for and attribution; Escape closes', async () => {
    stub(false)
    renderCard('https://www.ibdb.com/broadway-cast-staff/kern-1')
    const link = screen.getByRole('link', { name: 'Jerome Kern' })
    expect(screen.queryByRole('group')).toBeNull()
    fireEvent.focus(link)
    expect(await screen.findByText('American composer')).toBeTruthy()
    expect(screen.getByText('Kern was a composer. He wrote Show Boat.')).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Show Boat' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Photo of Jerome Kern' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeTruthy()
    expect(link.getAttribute('href')).toBe('https://www.ibdb.com/broadway-cast-staff/kern-1')
    fireEvent.keyDown(link, { key: 'Escape' })
    expect(screen.queryByRole('group')).toBeNull()
  })

  it('opens on hover and closes on blur', async () => {
    stub(false)
    renderCard()
    const trigger = screen.getByRole('button', { name: 'Jerome Kern' })
    fireEvent.click(trigger)
    expect(await screen.findByRole('group', { name: 'About Jerome Kern' })).toBeTruthy()
    fireEvent.blur(trigger, { relatedTarget: document.body })
    expect(screen.queryByRole('group')).toBeNull()
  })

  it('degrades to the name only when fetches fail, with no attribution', async () => {
    stub(true)
    renderCard('https://example.com/p')
    fireEvent.focus(screen.getByRole('link', { name: 'Jerome Kern' }))
    const card = await screen.findByRole('group', { name: 'About Jerome Kern' })
    await vi.waitFor(() => expect(screen.queryByText('Loading…')).toBeNull())
    expect(card.textContent).toContain('Jerome Kern')
    expect(screen.queryByRole('link', { name: 'CC BY-SA 4.0' })).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
