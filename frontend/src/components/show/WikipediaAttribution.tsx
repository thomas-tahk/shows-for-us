export default function WikipediaAttribution({ enwiki }: { enwiki: string }) {
  const href = `https://en.wikipedia.org/wiki/${encodeURIComponent(enwiki.replace(/ /g, '_'))
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')}`
  const link = 'text-amber-400 underline hover:no-underline'
  return (
    <p data-testid="wikipedia-attribution" className="border-t border-neutral-800 pt-4 text-sm text-neutral-400 break-words">
      Facts on this page draw on the Wikipedia article{' '}
      <a className={link} href={href}>{enwiki}</a>, available under{' '}
      <a className={link} href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
    </p>
  )
}
