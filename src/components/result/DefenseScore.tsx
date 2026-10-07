interface DefenseScoreProps {
  value: number
}

export function DefenseScore({ value }: DefenseScoreProps) {
  const safeValue = Math.max(0, Math.min(5, value))
  return (
    <div className="defense-score" aria-label={`魔王防禦值 ${safeValue} 分，滿分 5 分`}>
      <span className="defense-score__label">魔王防禦值</span>
      <span className="defense-score__value" aria-hidden="true">
        <strong>{safeValue}</strong><span>/ 5</span>
      </span>
      <span className="defense-score__meter" role="progressbar" aria-label="魔王防禦值" aria-valuemin={0} aria-valuemax={5} aria-valuenow={safeValue}>
        <span aria-hidden="true" style={{ transform: `scaleX(${safeValue / 5})` }} />
      </span>
    </div>
  )
}
