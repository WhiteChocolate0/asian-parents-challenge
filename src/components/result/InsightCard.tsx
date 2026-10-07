interface InsightCardProps {
  label: string
  text: string
  icon: 'heart' | 'brain' | 'chat'
}

const paths = {
  heart: <path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7a4.3 4.3 0 0 1 8.8-1.2 4.3 4.3 0 0 1 8.8 1.2Z" />,
  brain: <path d="M9 4a3 3 0 0 0-5 2 3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 4 3V4Zm6 0a3 3 0 0 1 5 2 3 3 0 0 1 1 5 3 3 0 0 1-2 5 3 3 0 0 1-4 3V4ZM9 9H6m9 0h3M9 15H6m9 0h3" />,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.4-.7L4 20l1.2-3.7A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />,
}

export function InsightCard({ label, text, icon }: InsightCardProps) {
  return (
    <article className="insight-card">
      <span className="insight-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{paths[icon]}</svg></span>
      <h3>{label}</h3>
      <p>{text}</p>
    </article>
  )
}
