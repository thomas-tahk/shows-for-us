// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { formatPremiereDate } from '../../data/catalogShard'
import type { CatalogShow } from '../../data/catalogShow'
import CatalogShowBody from './CatalogShowBody'

afterEach(cleanup)

const show: CatalogShow = {
  slug: 'x',
  title: 'X Musical',
  qid: 'Q1',
  enwiki: 'X (musical)',
  composers: [{ name: 'Ann Composer', qid: 'Q2', ibdb_url: 'https://www.ibdb.com/broadway-cast-staff/ann-1' }],
  lyricists: [],
  librettists: [{ name: 'Bo Writer', qid: 'Q3' }],
  premiere: { date: '1927-12-27', venue: 'Ziegfeld Theatre' },
  awards: [{ name: 'Tony Award for Best Musical', qid: 'Q4' }],
  links: { wikipedia: 'https://en.wikipedia.org/wiki/X', wikidata: 'https://www.wikidata.org/wiki/Q1' },
  summary: { text: 'A summary.', source_url: 'https://en.wikipedia.org/wiki/X', license: 'CC BY-SA 4.0', modified: false },
}

describe('CatalogShowBody', () => {
  it('renders the record', () => {
    render(<CatalogShowBody show={show} />)
    expect(screen.getByRole('heading', { level: 1, name: 'X Musical' })).toBeTruthy()
    expect(screen.getByText('A summary.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ann Composer' }).getAttribute('href')).toBe(show.composers[0].ibdb_url)
    expect(screen.getByText('Bo Writer').closest('a')).toBeNull()
    expect(screen.getByText('27 December 1927, Ziegfeld Theatre')).toBeTruthy()
    expect(screen.getByText('Tony Award for Best Musical')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Wikipedia' }).getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.queryByRole('link', { name: 'IBDB' })).toBeNull()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('renders a summary with newlines as separate paragraphs', () => {
    const two = { ...show, summary: { ...show.summary!, text: 'One.\nTwo.' } }
    render(<CatalogShowBody show={two} />)
    expect(screen.getByText('One.').tagName).toBe('P')
    expect(screen.getByText('Two.').tagName).toBe('P')
  })

  it('shows the sample-data note only when live is false', () => {
    render(<CatalogShowBody show={show} live={false} />)
    expect(screen.getByRole('note').textContent).toContain('Sample data: this page was built from test fixtures')
  })
})

describe('formatPremiereDate', () => {
  it('handles every precision', () => {
    expect(formatPremiereDate('1927')).toBe('1927')
    expect(formatPremiereDate('1927-12')).toBe('December 1927')
    expect(formatPremiereDate('1927-12-27')).toBe('27 December 1927')
    expect(formatPremiereDate('c. 1900')).toBe('c. 1900')
  })
})
