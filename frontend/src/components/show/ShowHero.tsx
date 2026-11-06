import type { ReactNode } from 'react'

/** Title block: eyebrow, h1, one-line facts, optional notes; image (if any) beside it on desktop, above on phones. */
export default function ShowHero({ title, eyebrow, subtitle, image, children }: {
  title: string
  eyebrow?: string
  subtitle?: string
  image?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/50">
      <div className={`flex flex-col gap-6 p-5 sm:p-8 ${image ? 'md:flex-row md:items-center' : ''}`}>
        {image && <div className="md:order-2 md:w-80 md:shrink-0">{image}</div>}
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="text-sm font-bold uppercase tracking-widest text-amber-400">{eyebrow}</p>}
          <h1 className="mt-1 text-4xl font-extrabold leading-tight text-white break-words sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-neutral-200 break-words">{subtitle}</p>}
          {children}
        </div>
      </div>
    </header>
  )
}
