import { load } from 'js-yaml'
import { parseWriteup, type Writeup } from './writeup'

// Resolved at build time by Vite; each value is the raw YAML text.
const files = import.meta.glob('/content/shows/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const bySlug = new Map<string, Writeup>()
for (const [path, raw] of Object.entries(files)) {
  const result = parseWriteup(load(raw))
  if (!result.ok) throw new Error(`${path}: ${result.errors.join('; ')}`)
  bySlug.set(result.value.slug, result.value)
}

export function getWriteup(slug: string): Writeup | undefined {
  return bySlug.get(slug)
}
