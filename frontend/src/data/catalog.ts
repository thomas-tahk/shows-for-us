import flagshipsRaw from '../../data/flagships.json'
import showsRaw from '../../data/shows.json'
import type { Flagship, Show, ShowsFile } from './show'
import { getWriteup } from './loadWriteups'
import type { Writeup } from './writeup'

export const flagships = flagshipsRaw as Flagship[]
const showsFile = showsRaw as unknown as ShowsFile

/** False while data/shows.json was built from offline fixtures: its image, summary and links are fake. */
export const dataIsLive = showsFile.meta.live

export function getFlagship(slug: string): Flagship | undefined {
  return flagships.find(f => f.slug === slug)
}

export function getShowData(slug: string): Show | undefined {
  return showsFile.shows.find(s => s.slug === slug)
}

export interface SearchEntry {
  slug: string
  title: string
  creators: string[]
  haystack: string
}

/** Lowercase, accent-stripped, punctuation runs collapsed to one space. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function buildIndex(
  list: Flagship[],
  writeup: (slug: string) => Writeup | undefined,
): SearchEntry[] {
  return list.map(f => {
    const creators = [...new Set((writeup(f.slug)?.creators ?? []).map(c => c.name))]
    return { slug: f.slug, title: f.title, creators, haystack: normalize([f.title, ...creators].join(' ')) }
  })
}

export function filterIndex(index: SearchEntry[], query: string): SearchEntry[] {
  const q = normalize(query)
  return q === '' ? index : index.filter(e => e.haystack.includes(q))
}

export const searchIndex = buildIndex(flagships, getWriteup)
