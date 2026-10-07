interface ResultTitleProps {
  title: string
  name: string
}

export function ResultTitle({ title, name }: ResultTitleProps) {
  return (
    <div className="result-title">
      <p className="result-title__eyebrow">{title}</p>
      <h1>{name}</h1>
    </div>
  )
}
