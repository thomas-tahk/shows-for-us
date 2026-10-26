import type { ReactNode } from 'react'

export default function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}
