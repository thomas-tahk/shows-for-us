import { useParams } from 'react-router-dom'
import { dataIsLive, getFlagship, getShowData } from '../data/catalog'
import { getWriteup } from '../data/loadWriteups'
import CatalogShowPage from './CatalogShowPage'
import ShowImage from '../components/show/ShowImage'
import Creators from '../components/show/Creators'
import History from '../components/show/History'
import OriginalCast from '../components/show/OriginalCast'
import Productions from '../components/show/Productions'
import Awards from '../components/show/Awards'
import ShowLinks from '../components/show/ShowLinks'
import PlayingNext from '../components/show/PlayingNext'
import { useShowEvents } from '../data/useShowEvents'
import ShowHero from '../components/show/ShowHero'
import WikipediaSummary from '../components/show/WikipediaSummary'
import WikipediaAttribution from '../components/show/WikipediaAttribution'

/** A write-up is a draft until the owner has opened the sources and signed it off. */
function isDraft(w: { sources_opened: boolean; status: string }): boolean {
  return !w.sources_opened || w.status !== 'owner-checked'
}

export default function ShowPage() {
  const { slug = '' } = useParams()
  const flagship = getFlagship(slug)
  if (!flagship) return <CatalogShowPage slug={slug} />
  return <FlagshipShowPage slug={slug} flagship={flagship} />
}

function FlagshipShowPage({ slug, flagship }: { slug: string; flagship: NonNullable<ReturnType<typeof getFlagship>> }) {
  const events = useShowEvents(slug)

  const writeup = getWriteup(slug)
  const data = getShowData(slug)
  // Fixture-built data (meta.live false) has a fake image and placeholder summary: never show it.
  const live = dataIsLive && data !== undefined
  const officialUrl = writeup?.tickets?.official_url ?? (live ? data.links.official_site : undefined)

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-6">
      <ShowHero
        title={flagship.title}
        eyebrow="Featured musical"
        image={live && data.image ? <ShowImage image={data.image} title={flagship.title} /> : undefined}
      >
        {writeup && isDraft(writeup) && (
          <p
            role="note"
            className="mt-4 rounded-lg border border-amber-400 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
          >
            Draft: these facts haven&apos;t been checked against their sources yet.
          </p>
        )}
      </ShowHero>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {writeup && <Creators creators={writeup.creators} />}
        {writeup && <Awards awards={writeup.awards} />}
      </div>

      <PlayingNext state={events.state} events={events.events} runs={writeup?.runs ?? []} officialUrl={officialUrl} title={flagship.title} />

      {live && data.summary && <WikipediaSummary summary={data.summary} />}

      {writeup && (
        <>
          <History paragraphs={writeup.history} />
          <OriginalCast cast={writeup.original_cast} />
          <Productions productions={writeup.productions} />
        </>
      )}

      <ShowLinks
        ibdb={live ? data.links.ibdb : undefined}
        playbill={live ? data.links.playbill : undefined}
      />

      <WikipediaAttribution enwiki={flagship.enwiki} />
    </main>
  )
}
