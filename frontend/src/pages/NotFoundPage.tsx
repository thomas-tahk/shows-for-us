import { Link } from 'react-router-dom'

export default function NotFoundPage({ what = 'page' }: { what?: 'page' | 'show' }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">
        {what === 'show' ? 'Show not found' : 'Page not found'}
      </h1>
      <p className="mt-2 text-neutral-300">
        {what === 'show'
          ? "We don't have a page for that show yet."
          : "That address doesn't lead anywhere on this site."}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-amber-400 px-5 font-semibold text-neutral-950 hover:bg-amber-300"
      >
        Back to all shows
      </Link>
    </main>
  )
}
