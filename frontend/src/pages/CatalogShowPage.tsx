import { useCatalogLive, useCatalogShow } from '../data/catalogShard'
import CatalogShowBody from '../components/show/CatalogShowBody'
import NotFoundPage from './NotFoundPage'

export default function CatalogShowPage({ slug }: { slug: string }) {
  const { state, retry } = useCatalogShow(slug)
  const live = useCatalogLive()
  if (state.status === 'missing') return <NotFoundPage what="show" />
  if (state.status === 'ok') return <CatalogShowBody show={state.show} live={live} />
  if (state.status === 'loading') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12" aria-busy="true">
        <p role="status" className="text-neutral-300">Loading…</p>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p role="alert" className="text-neutral-200">Couldn&apos;t load this show. Try again.</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-amber-400 px-5 font-semibold text-neutral-950 hover:bg-amber-300"
      >
        Try again
      </button>
    </main>
  )
}
