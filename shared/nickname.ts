const blocked = ['幹你娘', '操你媽', 'fuck', 'nigger']

export function normalizeNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const nickname = value.trim().normalize('NFC')
  const length = Array.from(nickname).length
  if (length < 2 || length > 12 || /[\p{Cc}\p{Cf}]/u.test(nickname)) return null
  if (blocked.some((word) => nickname.toLocaleLowerCase().includes(word))) return null
  return nickname
}
