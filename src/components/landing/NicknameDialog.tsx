import { useEffect, useRef, useState, type FormEvent } from 'react'
import { normalizeNickname } from '../../../shared/nickname'
import { PrimaryActionButton } from '../ui/PrimaryActionButton'

type NicknameDialogProps = {
  open: boolean
  loading: boolean
  serverError: boolean
  onClose: () => void
  onSubmit: (nickname: string) => void
}

export function NicknameDialog({ open, loading, serverError, onClose, onSubmit }: NicknameDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [validationError, setValidationError] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) { dialog.showModal(); inputRef.current?.focus() }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nickname = normalizeNickname(value)
    if (!nickname) { setValidationError(true); return }
    setValidationError(false)
    onSubmit(nickname)
  }

  return <dialog ref={ref} className="nickname-dialog" aria-labelledby="nickname-dialog-title" onCancel={(event) => { if (loading) event.preventDefault(); else onClose() }}>
    <form className="nickname-dialog__body" onSubmit={submit}>
      <button className="nickname-dialog__close" type="button" aria-label="關閉挑戰者登記" disabled={loading} onClick={onClose}>×</button>
      <p className="nickname-dialog__eyebrow">CHALLENGER CHECK-IN</p>
      <h2 id="nickname-dialog-title">挑戰者登記</h2>
      <p>在進入挑戰前，先留下你的暱稱吧！</p>
      <label htmlFor="challenger-nickname">你的暱稱</label>
      <input ref={inputRef} id="challenger-nickname" value={value} onChange={(event) => { setValue(event.target.value); setValidationError(false) }} placeholder="輸入暱稱" autoComplete="nickname" maxLength={24} aria-invalid={validationError} aria-describedby="nickname-hint" />
      <small id="nickname-hint">2～12 字，不需要真實姓名。</small>
      {validationError && <p className="nickname-dialog__error" role="alert">請輸入 2～12 字的暱稱，避免不適合的文字。</p>}
      {serverError && <p className="nickname-dialog__error" role="alert">登記暫時沒有成功，請再試一次。</p>}
      <PrimaryActionButton type="submit" disabled={loading} showArrow={!loading}>{loading ? '登記中…' : '開始挑戰'}</PrimaryActionButton>
    </form>
  </dialog>
}
