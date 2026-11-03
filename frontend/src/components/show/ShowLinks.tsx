import Section from './Section'

const link = 'inline-flex min-h-11 items-center text-amber-400 underline hover:no-underline'

export default function ShowLinks(props: { ibdb?: string; playbill?: string }) {
  const items = [
    props.ibdb && { href: props.ibdb, label: 'IBDB' },
    props.playbill && { href: props.playbill, label: 'Playbill' },
  ].filter((x): x is { href: string; label: string } => Boolean(x))
  if (items.length === 0) return null
  return (
    <Section id="links-h" title="Links">
      <ul className="flex flex-wrap gap-x-6">
        {items.map(i => (
          <li key={i.href}>
            <a className={link} href={i.href} rel="noopener noreferrer">{i.label}</a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
