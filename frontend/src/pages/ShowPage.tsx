import { useParams } from 'react-router-dom'
import { dataIsLive, getFlagship, getShowData } from '../data/catalog'
import { getWriteup } from '../data/loadWriteups'
import NotFoundPage from './NotFoundPage'
import ShowImage from '../components/show/ShowImage'
import Creators from '../components/show/Creators'
import History from '../components/show/History'
import OriginalCast from '../components/show/OriginalCast'
import Productions from '../components/show/Productions'
import Awards from '../components/show/Awards'
import ShowLinks from '../components/show/ShowLinks'
import WikipediaAttribution from '../components/show/WikipediaAttribution'

export default function ShowPage() {
  const { slug = '' } = useParams()
  const flagship = getFlagship(slug)
  if (!flagship) return <NotFoundPage what="show" />

  const writeup = getWriteup(slug)
  const data = getShowData(slug)
  // Fixture-built data (meta.live false) has a fake image and placeholder summary: never show it.
  const live = dataIsLive && data !== undefined

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white break-words">{flagship.title}</h1>
        {writeup && !writeup.sources_opened && (
          <p
            role="note"
            className="mt-3 rounded-lg border border-amber-400 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
          >
            Draft: these facts haven&apos;t been checked against their sources yet.
          </p>
        )}
      </header>

      {live && data.image && <ShowImage image={data.image} title={flagship.title} />}

      {writeup && <Creators creators={writeup.creators} />}

      {/* PLAYING NEXT slot (issue #7): live ticket dates go here, between creators and history. */}

      {live && data.summary && (
        <section aria-labelledby="summary-h">
          <h2 id="summary-h" className="text-xl font-semibold text-white">From Wikipedia</h2>
          <p className="mt-2 text-neutral-200 leading-relaxed">{data.summary.text}</p>
          <p className="mt-1 text-xs text-neutral-400">
            Text from{' '}
            <a className="text-amber-400 underline" href={data.summary.source_url}>this Wikipedia article</a>,{' '}
            <a className="text-amber-400 underline" href="https://creativecommons.org/licenses/by-sa/4.0/">
              CC BY-SA 4.0
            </a>
            , unmodified.
          </p>
        </section>
      )}

      {writeup && (
        <>
          <History paragraphs={writeup.history} />
          <OriginalCast cast={writeup.original_cast} />
          <Productions productions={writeup.productions} />
          <Awards awards={writeup.awards} />
        </>
      )}

      <ShowLinks
        officialUrl={writeup?.tickets?.official_url ?? data?.links.official_site}
        ibdb={data?.links.ibdb}
        playbill={data?.links.playbill}
      />

      <WikipediaAttribution enwiki={flagship.enwiki} />
    </main>
  )
}
