export default function Footer() {
  const link = 'text-amber-400 hover:underline'
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-neutral-800 px-4 py-6 text-sm leading-relaxed text-neutral-400 break-words"
    >
      <div className="mx-auto max-w-3xl space-y-3">
        <p>
          Show facts come from{' '}
          <a href="https://www.wikidata.org" className={link}>Wikidata</a> (CC0).
          Descriptions come from <span>Wikipedia</span>, whose text is available under{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" className={link}>
            CC BY-SA 4.0
          </a>
          . Where a page uses Wikipedia text it says so and links the article.
        </p>
        <p>
          Live dates come from Ticketmaster&apos;s Discovery API. They are fetched when you open a
          page and are not stored by this site. We don&apos;t sell tickets; links go to the sellers.
        </p>
      </div>
    </footer>
  )
}
