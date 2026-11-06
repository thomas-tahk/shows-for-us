import type { ReactNode } from 'react'

/** A titled card. The heading names the region (aria-labelledby). */
export default function Section({ id, title, children, className = '' }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 ${className}`}>
      <h2 id={id} className="flex items-center gap-3 text-lg font-bold text-white">
        <span aria-hidden="true" className="h-5 w-1 rounded-full bg-amber-400" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
