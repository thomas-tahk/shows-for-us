/**
 * Mirrors `ShowEvent` in api/_lib/events.ts (the app tsconfig only includes src/, and that
 * file belongs to the Vercel function's program). Keep the two in sync.
 */
export interface ShowEvent {
  id: string
  name: string
  /** Local date at the venue, YYYY-MM-DD. */
  date: string
  /** Local time at the venue, HH:MM:SS. */
  time: string | null
  url: string
  venue: string | null
  city: string | null
  state: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "2026-11-14" -> "Sat, Nov 14, 2026". Pure string/calendar math: no timezone conversion. */
export function formatLocalDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return date
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
  return `${DAYS[dow]}, ${MONTHS[mo - 1]} ${d}, ${y}`
}

/** "19:30:00" -> "7:30 PM". */
export function formatLocalTime(time: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(time)
  if (!m) return time
  const h = Number(m[1])
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

/** Curated run dates may be YYYY, YYYY-MM or YYYY-MM-DD. */
export function formatPartialDate(date: string): string {
  const ym = /^(\d{4})-(\d{2})$/.exec(date)
  if (ym) return `${MONTHS[Number(ym[2]) - 1]} ${ym[1]}`
  return formatLocalDate(date)
}
