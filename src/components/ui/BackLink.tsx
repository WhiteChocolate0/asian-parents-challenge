type BackLinkProps = {
  children: string
  onClick: () => void
  className?: string
}

export function BackLink({ children, onClick, className = '' }: BackLinkProps) {
  return <button type="button" className={`back-link ${className}`.trim()} onClick={onClick}>
    <span className="back-link__arrow" aria-hidden="true">←</span>{children}
  </button>
}
