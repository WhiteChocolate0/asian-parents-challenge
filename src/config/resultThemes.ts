import type { Dimension } from '../types'
import moneyImage from '../assets/images/results/parent-money.png'
import safetyImage from '../assets/images/results/parent-safety.png'
import faceImage from '../assets/images/results/parent-face.png'
import traditionImage from '../assets/images/results/parent-tradition.png'

export const RESULT_THEMES: Record<Dimension, {
  imageKey: `parent-${Dimension}`
  imageSrc: string
  prop: 'abacus' | 'shield' | 'radar' | 'thermos'
  characterAlt: string
  storyAccent: string
  halo: string
  surface: string
}> = {
  money: { imageKey: 'parent-money', imageSrc: moneyImage, prop: 'abacus', characterAlt: '拿著算盤精打細算的家長魔王', storyAccent: '#92765D', halo: '#E1E9DE', surface: '#F1F2E9' },
  safety: { imageKey: 'parent-safety', imageSrc: safetyImage, prop: 'shield', characterAlt: '拿著盾牌謹慎觀察的家長魔王', storyAccent: '#77758F', halo: '#E3E3ED', surface: '#EFF0F3' },
  face: { imageKey: 'parent-face', imageSrc: faceImage, prop: 'radar', characterAlt: '拿著獎盃與比較排行榜的家長魔王', storyAccent: '#AB7782', halo: '#F0E2E6', surface: '#F7EFF0' },
  tradition: { imageKey: 'parent-tradition', imageSrc: traditionImage, prop: 'thermos', characterAlt: '穿著深藍西裝堅持傳統做法的家長魔王', storyAccent: '#6F8197', halo: '#DEE6EE', surface: '#EEF2F4' },
}

export const DIMENSION_LABELS: Record<Dimension, string> = {
  money: '省錢',
  safety: '安全',
  face: '面子',
  tradition: '傳統',
}
