import type { Run } from '../../data/writeup'
import { formatLocalDate, formatLocalTime, formatPartialDate, localToday, upcomingRuns, type ShowEvent } from '../../data/events'
import Section from './Section'

interface Props {
  state: 'loading' | 'ok' | 'unavailable'
  events: ShowEvent[]
  runs: Run[]
  officialUrl?: string
  /** YYYY-MM-DD used to drop finished runs; defaults to the viewer's local date. */
  today?: string
}

const linkClass =
  'inline-flex min-h-11 items-center rounded-md border border-amber-400 px-3 text-sm font-semibold text-amber-300 hover:bg-amber-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300'

function OutLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <a className={linkClass} href={href} target="_blank" rel="noopener noreferrer">
      {label}{' '}
      <span className="sr-only">{detail} (opens in a new tab)</span>
    </a>
  )
}

function place(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(', ')
}

function runDates(run: Run): string {
  if (run.start && run.end) return `${formatPartialDate(run.start)} to ${formatPartialDate(run.end)}`
  if (run.start) return `From ${formatPartialDate(run.start)}`
  if (run.end) return `Until ${formatPartialDate(run.end)}`
  return ''
}

const itemClass =
  'flex flex-col items-start gap-3 rounded-lg border border-neutral-700 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'

export default function PlayingNext({ state, events, runs: allRuns, officialUrl, today }: Props) {
  const showEvents = state === 'ok' && events.length > 0
  const runs = upcomingRuns(allRuns, today ?? localToday())
  const status =
    state === 'loading'
      ? 'Checking live dates…'
      : state === 'unavailable'
        ? 'Live dates are unavailable right now.'
        : events.length === 0
          ? 'No upcoming dates found on Ticketmaster.'
          : `${events.length} upcoming ${events.length === 1 ? 'date' : 'dates'} from Ticketmaster.`
  return (
    <Section id="playing-next-h" title="Playing next">
      <p role="status" className={showEvents ? 'sr-only' : 'text-neutral-200'}>{status}</p>

      {showEvents && (
        <div>
          <ul className="space-y-3">
            {events.map(e => {
              const when = e.time ? `${formatLocalDate(e.date)} · ${formatLocalTime(e.time)}` : formatLocalDate(e.date)
              return (
                <li key={e.id} className={itemClass}>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{when}</p>
                    <p className="text-sm text-neutral-300 break-words">{place(e.venue, e.city, e.state)}</p>
                  </div>
                  <OutLink href={e.url} label="Tickets" detail={`for ${when}${e.venue ? ` at ${e.venue}` : ''}`} />
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-xs text-neutral-400">Dates from Ticketmaster</p>
        </div>
      )}

      {runs.length > 0 && (
        <div className={state === 'loading' ? '' : 'mt-5'}>
          <h3 className="text-base font-semibold text-white">Runs we know about</h3>
          <ul className="mt-2 space-y-3">
            {runs.map(r => (
              <li key={`${r.name}-${r.ticket_url}`} className={itemClass}>
                <div className="min-w-0">
                  <p className="font-semibold text-white break-words">{r.name}</p>
                  <p className="text-sm text-neutral-300 break-words">{place(r.venue, r.city)}</p>
                  {runDates(r) && <p className="text-sm text-neutral-300">{runDates(r)}</p>}
                </div>
                <OutLink href={r.ticket_url} label="Tickets" detail={`for ${r.name} at ${r.venue}`} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {officialUrl && (
        <p className="mt-5">
          <OutLink href={officialUrl} label="Official tickets" detail="on the show's official site" />
        </p>
      )}
    </Section>
  )
}
