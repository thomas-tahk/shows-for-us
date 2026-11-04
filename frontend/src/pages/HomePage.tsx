import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchIndex } from '../data/catalog'
import { search, type SearchableEntry } from '../data/search'
import { useCatalogIndex } from '../data/useCatalogIndex'

const RESULT_LIMIT = 50

const flagshipEntries: SearchableEntry[] = searchIndex.map(f => ({
  slug: f.slug,
  title: f.title,
  year: null,
  creators: f.creators,
  flagship: true,
}))

export default function HomePage() {
  const [query, setQuery] = useState('')
  const catalog = useCatalogIndex()
  const entries = useMemo(() => {
    const flagshipSlugs = new Set(flagshipEntries.map(f => f.slug))
    return [...flagshipEntries, ...catalog.entries.filter(c => !flagshipSlugs.has(c.slug))]
  }, [catalog.entries])
  const { results, total } = search(entries, query, RESULT_LIMIT)
  const isEmptyQuery = query.trim() === ''

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-white">Find a musical</h1>
      <p className="mt-2 text-neutral-300">
        History, the people who made it, and who starred in it. Start typing a title or a creator.
      </p>

      <div className="mt-6">
        <label htmlFor="show-search" className="block text-sm font-semibold text-neutral-200">
          Search shows
        </label>
        <input
          id="show-search"
          type="search"
          autoComplete="off"
          value={query}
          onFocus={catalog.loadOrRetry}
          onChange={e => {
            catalog.load()
            setQuery(e.target.value)
          }}
          placeholder="e.g. Hamilton"
          className="mt-1 w-full min-h-11 bg-neutral-900 border border-neutral-600 text-white placeholder-neutral-400 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
        />
      </div>

      {isEmptyQuery && <h2 className="mt-6 text-lg font-semibold text-white">Featured shows</h2>}
      <p className="mt-4 text-sm text-neutral-300" role="status" aria-live="polite">
        {isEmptyQuery
          ? `${total} featured shows`
          : total > results.length
            ? `${total} shows found — showing the first ${results.length}`
            : `${total} ${total === 1 ? 'show' : 'shows'} found`}
        {!isEmptyQuery && catalog.state === 'loading' && ' (full catalogue still loading)'}
      </p>
      {catalog.state === 'failed' && (
        <p className="mt-2 text-sm text-amber-300" role="status">
          The full catalogue couldn&apos;t load, so only the featured shows are searchable.
        </p>
      )}

      {results.length === 0 ? (
        <p className="mt-2 text-neutral-300">
          No show matches &ldquo;{query.trim()}&rdquo;. Try a shorter title or a creator&apos;s name.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-800 border-y border-neutral-800">
          {results.map(r => (
            <li key={r.slug}>
              <Link
                to={`/show/${r.slug}`}
                className="block min-h-11 py-3 px-1 hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <span className="block font-semibold text-amber-400 break-words">{r.title}</span>
                {(r.year || r.creators.length > 0) && (
                  <span className="block text-sm text-neutral-400 break-words">
                    {[r.year, r.creators.join(', ')].filter(Boolean).join(' · ')}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
