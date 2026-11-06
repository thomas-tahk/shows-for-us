import Section from './Section'

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-amber-400 px-4 font-semibold text-amber-300 hover:bg-amber-400 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400'

export default function ShowLinks(props: { ibdb?: string; playbill?: string; extra?: { href: string; label: string }[] }) {
  const items = [
    props.ibdb && { href: props.ibdb, label: 'IBDB' },
    props.playbill && { href: props.playbill, label: 'Playbill' },
    ...(props.extra ?? []),
  ].filter((x): x is { href: string; label: string } => Boolean(x))
  if (items.length === 0) return null
  return (
    <Section id="links-h" title="Links">
      <ul className="flex flex-wrap gap-3">
        {items.map(i => (
          <li key={i.href}>
            <a className={button} href={i.href} rel="noopener noreferrer">
              {i.label}
              <span aria-hidden="true">&#8599;</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
