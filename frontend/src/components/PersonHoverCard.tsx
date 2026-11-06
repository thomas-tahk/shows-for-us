import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { Link } from 'react-router-dom'
import { knownFor, loadPersonSummary, type PersonSummary } from '../data/personSummary'
import { useCatalogIndex } from '../data/useCatalogIndex'

const OPEN_DELAY_MS = 150
const CLOSE_DELAY_MS = 200
const linkClass = 'text-amber-400 underline hover:no-underline'

function useOpenState() {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const schedule = useCallback((next: boolean, delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(next), delay)
  }, [])
  const set = useCallback((next: boolean) => {
    window.clearTimeout(timer.current)
    setOpen(next)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { open, schedule, set }
}

/** undefined while loading; null when nothing could be fetched. */
function usePersonSummary(qid: string): PersonSummary | null | undefined {
  const [result, setResult] = useState<{ qid: string; summary: PersonSummary | null }>()
  useEffect(() => {
    let live = true
    loadPersonSummary(qid).then(summary => live && setResult({ qid, summary }))
    return () => {
      live = false
    }
  }, [qid])
  return result?.qid === qid ? result.summary : undefined
}

function CardBody({ name, qid }: { name: string; qid: string }) {
  const summary = usePersonSummary(qid)
  const catalog = useCatalogIndex()
  const { load } = catalog
  useEffect(load, [load])
  const shows = knownFor(catalog.entries, name)
  const info = summary ?? null
  const text = info?.extract ?? null

  return (
    <>
      <div className="flex gap-3">
        {info?.thumbnailUrl && (
          <img src={info.thumbnailUrl} alt={`Photo of ${name}`} className="h-16 w-16 shrink-0 rounded-md bg-neutral-800 object-cover" />
        )}
        <div className="min-w-0">
          <p className="font-bold text-white break-words">{name}</p>
          {info?.description && <p className="text-sm text-amber-200 break-words">{info.description}</p>}
        </div>
      </div>
      {summary === undefined && <p className="mt-2 text-sm text-neutral-300">Loading…</p>}
      {text && <p className="mt-2 text-sm leading-relaxed text-neutral-100">{text}</p>}
      {shows.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-300">Known for</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {shows.map(s => (
              <li key={s.slug}>
                <Link className={linkClass} to={`/show/${s.slug}`}>{s.title}</Link>
                {s.year && <span className="text-neutral-300"> ({s.year})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {info && text && (
        <p className="mt-3 border-t border-neutral-700 pt-2 text-xs text-neutral-300">
          Excerpt from <a className={linkClass} href={info.pageUrl} rel="noopener noreferrer">Wikipedia</a>,{' '}
          <a className={linkClass} href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener noreferrer">CC BY-SA 4.0</a>.
        </p>
      )}
    </>
  )
}

/** Keeps the card inside the viewport horizontally (desktop popover; phones use a bottom sheet). */
function useClampToViewport(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !open) return
    el.style.transform = ''
    const { left, right } = el.getBoundingClientRect()
    const margin = 8
    const shift = right > window.innerWidth - margin ? window.innerWidth - margin - right : left < margin ? margin - left : 0
    if (shift !== 0) el.style.transform = `translateX(${shift}px)`
  })
  return ref
}

interface Props {
  name: string
  qid: string
  /** When set, the name is a normal link (never blocked by the card). */
  href?: string
  className?: string
}

/**
 * A person's name that opens a summary card on hover, keyboard focus, or (touch) a tap.
 * The card is absolutely positioned: opening it never moves page content.
 * Data is fetched in the browser on first open; if that fails the card shows the name only.
 */
export default function PersonHoverCard({ name, qid, href, className = '' }: Props) {
  const { open, schedule, set } = useOpenState()
  const wrapper = useRef<HTMLSpanElement>(null)
  const cardRef = useClampToViewport(open)
  const cardId = useId()
  const triggerRef = useRef<HTMLElement | null>(null)
  const suppressFocus = useRef(false)
  const closeAndRefocus = useCallback(() => {
    set(false)
    const trigger = triggerRef.current
    if (!trigger || document.activeElement === trigger) return
    suppressFocus.current = true // refocusing must not reopen the card
    trigger.focus()
    suppressFocus.current = false
  }, [set])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAndRefocus()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeAndRefocus])
  const focusedAt = useRef(0)
  // A tap focuses (opens) and then clicks: that click must not toggle the card shut again.
  const toggle = () => {
    if (open && Date.now() - focusedAt.current < 500) return
    set(!open)
  }
  const triggerClass = `inline-flex min-h-11 items-center rounded font-semibold focus-visible:outline-2 focus-visible:outline-amber-400 ${className}`

  return (
    <span
      ref={wrapper}
      className="relative inline-block"
      onPointerEnter={e => e.pointerType === 'mouse' && schedule(true, OPEN_DELAY_MS)}
      onPointerLeave={e => e.pointerType === 'mouse' && schedule(false, CLOSE_DELAY_MS)}
      onFocus={() => {
        if (suppressFocus.current) return
        focusedAt.current = Date.now()
        set(true)
      }}
      onBlur={e => {
        if (!wrapper.current?.contains(e.relatedTarget as Node | null)) set(false)
      }}
    >
      {href ? (
        <>
          <a ref={triggerRef as Ref<HTMLAnchorElement>} className={`${triggerClass} ${linkClass}`} href={href} rel="noopener noreferrer" aria-describedby={open ? cardId : undefined}>
            {name}
          </a>
          <button
            type="button"
            aria-label={`About ${name}`}
            aria-expanded={open}
            aria-controls={open ? cardId : undefined}
            onClick={toggle}
            className="hidden min-h-11 min-w-11 items-center justify-center text-amber-400 [@media(hover:none)]:inline-flex"
          >
            <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-400 text-xs font-bold">i</span>
          </button>
        </>
      ) : (
        <button
          ref={triggerRef as Ref<HTMLButtonElement>}
          type="button"
          aria-expanded={open}
          aria-controls={open ? cardId : undefined}
          onClick={toggle}
          className={`${triggerClass} text-left decoration-dotted underline underline-offset-4`}
        >
          {name}
        </button>
      )}
      {open && (
        <div
          ref={cardRef}
          id={cardId}
          role="group"
          aria-label={`About ${name}`}
          className="fixed inset-x-3 bottom-3 z-30 max-h-[70vh] overflow-y-auto rounded-xl border border-amber-400/60 bg-neutral-900 p-4 text-left font-normal shadow-2xl shadow-black sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-1 sm:w-80"
        >
          <CardBody name={name} qid={qid} />
          <button
            type="button"
            onClick={closeAndRefocus}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-amber-400 font-semibold text-amber-300 sm:hidden"
          >
            Close
          </button>
        </div>
      )}
    </span>
  )
}
