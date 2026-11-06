// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { matchCredit } from '../../data/matchCredit'
import Creators from './Creators'

afterEach(cleanup)

const creators = [
  { name: 'Lin-Manuel Miranda', role: 'music', source: 'x' },
  { name: 'Someone Else', role: 'book', source: 'x' },
]
const known = [{ name: 'lin-manuel miranda', qid: 'Q1', ibdb_url: 'https://www.ibdb.com/broadway-cast-staff/lm-1' }]

describe('Creators', () => {
  it('matches names case-insensitively and only exactly', () => {
    expect(matchCredit('Lin-Manuel Miranda', known)?.qid).toBe('Q1')
    expect(matchCredit('Lin Miranda', known)).toBeUndefined()
  })

  it('gives a matched creator a hover-card link and leaves others as plain text', () => {
    render(<Creators creators={creators} known={known} />)
    expect(screen.getByRole('link', { name: 'Lin-Manuel Miranda' }).getAttribute('href')).toBe(known[0].ibdb_url)
    expect(screen.getByText('Someone Else').closest('a, button')).toBeNull()
  })
})
