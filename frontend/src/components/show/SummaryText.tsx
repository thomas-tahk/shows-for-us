/** Wikipedia summary text: one <p> per line, so paragraph breaks survive. */
export default function SummaryText({ text }: { text: string }) {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '')
  return (
    <div className="mt-2 space-y-3 text-neutral-200 leading-relaxed">
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  )
}
