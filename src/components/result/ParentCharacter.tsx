import { RESULT_THEMES } from '../../config/resultThemes'
import type { Dimension } from '../../types'

interface ParentCharacterProps {
  type: Dimension
}

export function ParentCharacter({ type }: ParentCharacterProps) {
  const theme = RESULT_THEMES[type]

  return (
    <figure className="parent-character" data-image-key={theme.imageKey}>
      <span className="parent-character__halo" aria-hidden="true" />
      <span className="parent-character__orbit parent-character__orbit--one" aria-hidden="true" />
      <span className="parent-character__orbit parent-character__orbit--two" aria-hidden="true" />
      <img className="parent-character__art" src={theme.imageSrc} alt={theme.characterAlt} loading="eager" decoding="async" />
      <figcaption className="parent-character__label" aria-hidden="true">魔王登場</figcaption>
    </figure>
  )
}
