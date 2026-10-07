import { useEffect, useRef } from 'react'
import { RESULT_THEMES } from '../../config/resultThemes'
import type { ResultViewModel } from './types'

interface ShareCardProps {
  result: ResultViewModel
  onReady?: (canvas: HTMLCanvasElement | null) => void
  nickname?: string
}

export function ShareCard({ result, onReady, nickname }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const profile = result.profile

  useEffect(() => {
    let cancelled = false
    const theme = RESULT_THEMES[result.resultType]
    const character = new Image()
    character.src = theme.imageSrc

    const renderCard = (imageReady: boolean) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      canvas.width = 1080
      canvas.height = 1920

      const ink = '#343B37'
      const paper = '#FAF8F2'
      ctx.fillStyle = paper
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#FFFDF8'
      roundedRect(ctx, 48, 48, 984, 1824, 52)
      ctx.fill()

      ctx.fillStyle = ink
      ctx.font = '900 50px "Kaitou Display", "LINE Seed TW", sans-serif'
      ctx.fillText('亞洲父母挑戰', 100, 146)
      ctx.fillStyle = theme.storyAccent
      ctx.font = '700 28px "Nightgazer Game", "LINE Seed TW", sans-serif'
      ctx.fillText(nickname ? `${nickname}家的測驗結果` : '我的測驗結果', 100, 219)
      ctx.fillStyle = '#66746C'
      ctx.font = '400 32px "LINE Seed TW", sans-serif'
      ctx.fillText('我家的家長魔王是——', 100, 274)
      ctx.fillStyle = ink
      ctx.font = '900 66px "Kaitou Display", "LINE Seed TW", sans-serif'
      wrapText(ctx, profile.name, 100, 355, 865, 82, 2)

      ctx.fillStyle = theme.halo
      ctx.beginPath()
      ctx.ellipse(540, 795, 360, 330, 0, 0, Math.PI * 2)
      ctx.fill()
      if (imageReady) drawContainedImage(ctx, character, 110, 485, 860, 650)
      else drawCharacter(ctx, 540, 810, ink, theme.storyAccent, theme.halo, theme.prop)

      ctx.fillStyle = ink
      roundedRect(ctx, 92, 1170, 896, 154, 28)
      ctx.fill()
      ctx.fillStyle = '#FFFDF8'
      ctx.font = '700 33px "Nightgazer Game", "LINE Seed TW", sans-serif'
      ctx.fillText('魔王防禦值', 130, 1237)
      ctx.fillStyle = '#F0E5CC'
      ctx.font = '700 82px "Nightgazer Game", "LINE Seed TW", sans-serif'
      ctx.fillText(`${result.defense} / 5`, 640, 1282)

      ctx.fillStyle = theme.storyAccent
      ctx.font = '700 31px "Nightgazer Game", "LINE Seed TW", sans-serif'
      ctx.fillText('核心招式', 102, 1423)
      ctx.fillStyle = ink
      ctx.font = '700 45px "LINE Seed TW", sans-serif'
      wrapText(ctx, profile.skill, 102, 1503, 856, 65, 2)
      ctx.fillStyle = theme.storyAccent
      ctx.font = '700 29px "Nightgazer Game", "LINE Seed TW", sans-serif'
      ctx.fillText('破解提示', 102, 1643)
      ctx.fillStyle = ink
      ctx.font = '400 31px "LINE Seed TW", sans-serif'
      wrapText(ctx, profile.communicationTip ?? profile.strategy, 102, 1703, 856, 44, 2)
      ctx.fillStyle = '#66746C'
      ctx.font = '500 27px "LINE Seed TW", sans-serif'
      ctx.fillText('敢不敢來挑戰你家的？', 102, 1824)
      onReady?.(canvas)
    }

    void Promise.allSettled([
      document.fonts.load('900 48px "Kaitou Display"'),
      document.fonts.load('400 31px "LINE Seed TW"'),
      document.fonts.load('700 92px "Nightgazer Game"'),
      character.decode(),
    ]).then((loaded) => { if (!cancelled) renderCard(loaded[3].status === 'fulfilled') })
    return () => { cancelled = true }
  }, [result, onReady, profile.name, profile.skill, nickname])

  return (
    <figure className="share-card">
      <canvas ref={canvasRef} width={1080} height={1920} aria-label={`9 比 16 分享卡預覽：${profile.name}`} />
      <figcaption>9:16 分享卡・可下載為 PNG</figcaption>
    </figure>
  )
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function wrapText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = [...value]
  let line = ''
  let lineNumber = 0
  for (const word of words) {
    const next = line + word
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineNumber * lineHeight)
      line = word
      lineNumber += 1
      if (lineNumber >= maxLines) return
    } else line = next
  }
  if (line && lineNumber < maxLines) ctx.fillText(line, x, y + lineNumber * lineHeight)
}

function drawContainedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
  const drawnWidth = image.naturalWidth * scale
  const drawnHeight = image.naturalHeight * scale
  ctx.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight)
}

function drawCharacter(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, ink: string, accent: string, mint: string, prop: 'abacus' | 'shield' | 'radar' | 'thermos') {
  ctx.fillStyle = mint
  ctx.beginPath(); ctx.arc(centerX, centerY, 285, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink
  roundedRect(ctx, centerX - 195, centerY + 65, 390, 220, 130); ctx.fill()
  ctx.fillStyle = '#f0c7a7'
  ctx.beginPath(); ctx.ellipse(centerX, centerY - 35, 148, 180, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ink
  ctx.beginPath(); ctx.arc(centerX, centerY - 76, 155, Math.PI, 0); ctx.fill()
  ctx.fillRect(centerX - 150, centerY - 83, 300, 65)
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(centerX - 55, centerY - 4, 12, 0, Math.PI * 2); ctx.arc(centerX + 55, centerY - 4, 12, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = ink; ctx.lineWidth = 13; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(centerX - 32, centerY + 73); ctx.quadraticCurveTo(centerX, centerY + 58, centerX + 32, centerY + 73); ctx.stroke()
  ctx.fillStyle = accent
  ctx.font = '700 58px "Nightgazer Game", "LINE Seed TW", sans-serif'
  ctx.fillText('BOSS', centerX - 72, centerY + 205)
  ctx.strokeStyle = ink
  ctx.fillStyle = '#fbf9f3'
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  if (prop === 'abacus') {
    roundedRect(ctx, centerX - 270, centerY + 10, 92, 125, 16); ctx.fill(); ctx.stroke()
    for (let row = 0; row < 3; row += 1) {
      const y = centerY + 42 + row * 34
      ctx.beginPath(); ctx.moveTo(centerX - 252, y); ctx.lineTo(centerX - 196, y); ctx.stroke()
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(centerX - 226 + row * 13, y, 8, 0, Math.PI * 2); ctx.fill()
    }
  } else if (prop === 'shield') {
    ctx.beginPath(); ctx.moveTo(centerX + 200, centerY - 6); ctx.lineTo(centerX + 272, centerY + 18); ctx.lineTo(centerX + 264, centerY + 88); ctx.quadraticCurveTo(centerX + 240, centerY + 126, centerX + 216, centerY + 88); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(centerX + 220, centerY + 54); ctx.lineTo(centerX + 236, centerY + 70); ctx.lineTo(centerX + 256, centerY + 37); ctx.stroke()
  } else if (prop === 'radar') {
    roundedRect(ctx, centerX - 276, centerY + 28, 96, 95, 14); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = accent
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(centerX - 254 + i * 23, centerY + 103); ctx.lineTo(centerX - 254 + i * 23, centerY + 88 - i * 18); ctx.stroke() }
    ctx.strokeStyle = ink; ctx.beginPath(); ctx.arc(centerX - 186, centerY + 120, 30, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(centerX - 165, centerY + 141); ctx.lineTo(centerX - 145, centerY + 160); ctx.stroke()
  } else {
    roundedRect(ctx, centerX + 195, centerY + 4, 74, 136, 20); ctx.fill(); ctx.stroke()
    roundedRect(ctx, centerX + 211, centerY - 14, 42, 23, 8); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = accent
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(centerX + 210, centerY + 50 + i * 24); ctx.lineTo(centerX + 254, centerY + 50 + i * 24); ctx.stroke() }
  }
}
