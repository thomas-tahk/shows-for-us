import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { load } from 'js-yaml'
import { parseWriteup } from '../src/data/writeup'
import { getWriteup } from '../src/data/loadWriteups'

const root = join(__dirname, '..')
const flagships = JSON.parse(readFileSync(join(root, 'data/flagships.json'), 'utf8')) as {
  slug: string
  enwiki: string
}[]
const dir = join(root, 'content/shows')
const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
const read = (p: string) => load(readFileSync(p, 'utf8'))
type Good = Record<string, unknown> & { history: object[]; productions: object[] }

describe('curated write-ups', () => {
  it('has exactly one file per flagship slug', () => {
    expect(files.map((f) => f.replace(/\.yaml$/, '')).sort()).toEqual(flagships.map((f) => f.slug).sort())
    expect(files).toHaveLength(15)
  })

  describe.each(flagships)('$slug', ({ slug, enwiki }) => {
    const result = parseWriteup(read(join(dir, `${slug}.yaml`)))

    it('passes the schema', () => {
      expect(result.ok ? [] : result.errors).toEqual([])
    })

    it('matches its file name; unopened sources imply awaiting-owner-check', () => {
      if (!result.ok) throw new Error('invalid')
      expect(result.value.slug).toBe(slug)
      if (!result.value.sources_opened) expect(result.value.status).toBe('awaiting-owner-check')
    })

    it('never cites IBDB/Playbill/BWW; while unopened, cites only Wikipedia or the official site', () => {
      if (!result.ok) throw new Error('invalid')
      const v = result.value
      const urls = [
        ...v.creators,
        ...v.history,
        ...v.original_cast,
        ...v.productions,
        ...v.awards,
        ...v.runs,
        ...(v.tickets ? [v.tickets] : []),
      ].map((x) => x.source)
      const wiki = `https://en.wikipedia.org/wiki/${enwiki.replace(/ /g, '_')}`
      for (const u of urls) {
        expect(u).not.toMatch(/ibdb|playbill|broadwayworld/i)
        if (!v.sources_opened) expect(u === wiki || u === v.tickets?.official_url, u).toBe(true)
      }
    })
  })

  it('rejects a fact with no source and names the field', () => {
    const result = parseWriteup(read(join(root, 'fixtures/content/missing-source.yaml')))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toContain('history[0].source: required non-empty string')
  })

  it('rejects a missing sources_opened flag and a non-object root', () => {
    const good = { ...(read(join(dir, 'hamilton.yaml')) as Record<string, unknown>) }
    delete good.sources_opened
    const r = parseWriteup(good)
    expect(r.ok ? [] : r.errors).toContain('sources_opened: required boolean')
    expect(parseWriteup('nope').ok).toBe(false)
  })

  it('rejects unknown keys at the root and on items, naming the key', () => {
    const good = read(join(dir, 'hamilton.yaml')) as Good
    const bad = { ...good, trivia: 'x', history: [{ ...good.history[0], extra_fact: 'y' }, good.history[1]] }
    const r = parseWriteup(bad)
    expect(r.ok ? [] : r.errors).toEqual(expect.arrayContaining(['trivia: unknown key', 'history[0].extra_fact: unknown key']))
  })

  it('validates calendar dates', () => {
    const good = read(join(dir, 'hamilton.yaml')) as Good
    const withOpened = (opened: string) =>
      parseWriteup({ ...good, productions: [{ ...good.productions[0], opened }] })
    for (const ok of ['2015', '2015-08', '2024-02-29']) expect(withOpened(ok).ok, ok).toBe(true)
    for (const bad of ['2015-13', '2015-00', '2023-02-29', '2015-04-31', '2015-8']) {
      const r = withOpened(bad)
      expect(r.ok, bad).toBe(false)
      expect(r.ok ? [] : r.errors).toContain('productions[0].opened: must be a real date, YYYY, YYYY-MM or YYYY-MM-DD')
    }
  })

  it('loads through import.meta.glob', () => {
    const w = getWriteup('hamilton')
    expect(w?.title).toBe('Hamilton')
    expect(w?.history.length).toBeGreaterThanOrEqual(2)
    expect(getWriteup('does-not-exist')).toBeUndefined()
  })
})
