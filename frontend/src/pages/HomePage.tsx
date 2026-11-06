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
  // The catalogue never holds a flagship slug (assignSlugs avoids them), so no de-duplication.
  const entries = useMemo(() => [...flagshipEntries, ...catalog.entries], [catalog.entries])
  const { results, total } = search(entries, query, RESULT_LIMIT)
  const isEmptyQuery = query.trim() === ''

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/50 p-5 sm:p-8">
        <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">Find a musical</h1>
        <p className="mt-3 max-w-prose text-lg text-neutral-200">
          History, the people who made it, and who starred in it. Start typing a title or a creator.
        </p>

        <div className="mt-6">
          <label htmlFor="show-search" className="block text-sm font-bold uppercase tracking-wide text-amber-400">
            Search shows
          </label>
          <div className="relative mt-2">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
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
              className="w-full min-h-14 rounded-xl border-2 border-neutral-600 bg-neutral-950 py-3 pl-12 pr-4 text-lg text-white placeholder-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/30"
            />
          </div>
        </div>
      </header>

      {isEmptyQuery && <h2 className="mt-8 text-xl font-bold text-white">Featured shows</h2>}
      <p className={`${isEmptyQuery ? 'mt-1' : 'mt-6'} text-sm text-neutral-300`} role="status" aria-live="polite">
        {isEmptyQuery
          ? `${total} featured shows`
          : total > results.length
            ? `${total} shows found — showing the first ${results.length}`
            : `${total} ${total === 1 ? 'show' : 'shows'} found`}
        {!isEmptyQuery && catalog.state === 'loading' && ' (full catalogue still loading)'}
      </p>
      {catalog.state === 'failed' && (
        <p className="mt-2 rounded-lg border border-amber-400 bg-amber-400/10 px-3 py-2 text-sm text-amber-200" role="status">
          The full catalogue couldn&apos;t load, so only the featured shows are searchable.
        </p>
      )}

      {results.length === 0 ? (
        <p className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-neutral-200">
          No show matches &ldquo;{query.trim()}&rdquo;. Try a shorter title or a creator&apos;s name.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {results.map(r => (
            <li key={r.slug}>
              <Link
                to={`/show/${r.slug}`}
                className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-amber-400 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-amber-400 break-words">{r.title}</span>
                  {(r.year || r.creators.length > 0) && (
                    <span className="block text-sm text-neutral-300 break-words">
                      {[r.year, r.creators.join(', ')].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className="text-2xl text-amber-400">&rsaquo;</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
