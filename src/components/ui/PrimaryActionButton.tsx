import type { ReactNode } from 'react'

type PrimaryActionButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  disabled?: boolean
  showArrow?: boolean
}

export function PrimaryActionButton({ children, onClick, type = 'button', className = '', disabled = false, showArrow = true }: PrimaryActionButtonProps) {
  return <button type={type} className={`primary-action ${className}`.trim()} disabled={disabled} onClick={onClick}>
    <span>{children}</span>
    {showArrow && <svg className="primary-action__arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>}
  </button>
}
