/** Awards as amber chips. */
export default function AwardChips({ items }: { items: { key: string; label: string; year?: string | number }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(a => (
        <li key={a.key} className="rounded-full border border-amber-400/70 bg-amber-400/10 px-3 py-1 text-sm text-amber-100 break-words">
          {a.label}
          {a.year !== undefined && <span className="text-amber-300"> ({a.year})</span>}
        </li>
      ))}
    </ul>
  )
}
