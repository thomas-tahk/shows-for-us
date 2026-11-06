/** Wikipedia summary text: one <p> per line, so paragraph breaks survive. */
export default function SummaryText({ text }: { text: string }) {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '')
  return (
    <div className="space-y-4 text-neutral-100 leading-relaxed">
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  )
}
