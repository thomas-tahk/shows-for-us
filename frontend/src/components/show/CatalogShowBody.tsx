import type { CatalogShow } from '../../data/catalogShow'
import { formatPremiereDate } from '../../data/catalogShard'
import type { PersonCredit } from '../../data/show'
import Section from './Section'
import ShowLinks from './ShowLinks'

const link = 'text-amber-400 underline hover:no-underline'

function Person({ p }: { p: PersonCredit }) {
  if (!p.ibdb_url) return <span className="font-semibold">{p.name}</span>
  return <a className={`${link} font-semibold`} href={p.ibdb_url} rel="noopener noreferrer">{p.name}</a>
}

function CreatedBy({ show }: { show: CatalogShow }) {
  const groups = [
    { role: 'Music', people: show.composers },
    { role: 'Lyrics', people: show.lyricists },
    { role: 'Book', people: show.librettists },
  ].filter(g => g.people.length > 0)
  if (groups.length === 0) return null
  return (
    <Section id="creators-h" title="Created by">
      <ul className="space-y-1 text-neutral-200">
        {groups.map(g => (
          <li key={g.role} className="break-words">
            <span className="text-neutral-400">{g.role}: </span>
            {g.people.map((p, i) => (
              <span key={p.qid}>{i > 0 && ', '}<Person p={p} /></span>
            ))}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Premiere({ premiere }: { premiere: CatalogShow['premiere'] }) {
  if (!premiere.date && !premiere.venue) return null
  const text = [premiere.date && formatPremiereDate(premiere.date), premiere.venue].filter(Boolean).join(', ')
  return (
    <Section id="premiere-h" title="Premiere">
      <p className="text-neutral-200 break-words">{text}</p>
    </Section>
  )
}

export default function CatalogShowBody({ show, live }: { show: CatalogShow; live?: boolean }) {
  const { links, summary } = show
  const extra = [
    links.official_site && { href: links.official_site, label: 'Official site' },
    { href: links.wikipedia, label: 'Wikipedia' },
    { href: links.wikidata, label: 'Wikidata' },
  ].filter((x): x is { href: string; label: string } => Boolean(x))

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white break-words">{show.title}</h1>
        {live === false && (
          <p role="note" className="mt-3 rounded-lg border border-amber-400 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Sample data: this page was built from test fixtures, not live Wikipedia data.
          </p>
        )}
      </header>

      {summary && (
        <section aria-labelledby="summary-h">
          <h2 id="summary-h" className="text-xl font-semibold text-white">From Wikipedia</h2>
          <p className="mt-2 text-neutral-200 leading-relaxed">{summary.text}</p>
          <p className="mt-1 text-xs text-neutral-400">
            Text from{' '}
            <a className={link} href={summary.source_url}>this Wikipedia article</a>,{' '}
            <a className={link} href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
            , unmodified.
          </p>
        </section>
      )}

      <CreatedBy show={show} />
      <Premiere premiere={show.premiere} />
      {show.awards.length > 0 && (
        <Section id="awards-h" title="Awards">
          <ul className="space-y-1 text-neutral-200">
            {show.awards.map(a => <li key={a.qid} className="break-words">{a.name}</li>)}
          </ul>
        </Section>
      )}
      <ShowLinks ibdb={links.ibdb} playbill={links.playbill} extra={extra} />
    </main>
  )
}
