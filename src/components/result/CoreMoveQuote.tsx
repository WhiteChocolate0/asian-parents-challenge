interface CoreMoveQuoteProps {
  label: string
  quote: string
}

export function CoreMoveQuote({ label, quote }: CoreMoveQuoteProps) {
  return (
    <section className="core-move" aria-label={label}>
      <span className="core-move__label">{label}</span>
      <blockquote>{quote}</blockquote>
    </section>
  )
}
