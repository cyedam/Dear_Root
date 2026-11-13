// P1 히어로 식물 밭 — 배치 규칙. 숫자는 heroConfig.js에서 조절
import monstera from '../../assets/P1_hero/plants/plant-01-monstera.webp'
import bostonFern from '../../assets/P1_hero/plants/plant-02-boston-fern.webp'
import pothos from '../../assets/P1_hero/plants/plant-03-pothos.webp'
import sansevieria from '../../assets/P1_hero/plants/plant-04-sansevieria.webp'
import olive from '../../assets/P1_hero/plants/plant-05-olive.webp'
import pilea from '../../assets/P1_hero/plants/plant-06-pilea.webp'
import calathea from '../../assets/P1_hero/plants/plant-07-calathea.webp'
import birdOfParadise from '../../assets/P1_hero/plants/plant-08-bird-of-paradise.webp'
import asparagusFern from '../../assets/P1_hero/plants/plant-09-asparagus-fern.webp'
import rosemary from '../../assets/P1_hero/plants/plant-10-rosemary.webp'
import basil from '../../assets/P1_hero/plants/plant-11-basil.webp'
import grass from '../../assets/P1_hero/plants/plant-12-grass.webp'
// 맨 뒤 키 큰 식물 (13~22번)
import monsteraAlbo from '../../assets/P1_hero/plants/plant-13-monstera-albo.webp'
import strelitziaNicolai from '../../assets/P1_hero/plants/plant-14-strelitzia-nicolai.webp'
import dracaena from '../../assets/P1_hero/plants/plant-15-dracaena-marginata.webp'
import kentiaPalm from '../../assets/P1_hero/plants/plant-16-kentia-palm.webp'
import fiddleLeafFig from '../../assets/P1_hero/plants/plant-17-fiddle-leaf-fig.webp'
import luckyBamboo from '../../assets/P1_hero/plants/plant-18-lucky-bamboo.webp'
import papyrus from '../../assets/P1_hero/plants/plant-19-papyrus.webp'
import alocasia from '../../assets/P1_hero/plants/plant-20-alocasia.webp'
import zzPlant from '../../assets/P1_hero/plants/plant-21-zz-plant.webp'
import miscanthus from '../../assets/P1_hero/plants/plant-22-miscanthus.webp'

// 키 작은 식물은 가운데에, 키 큰 식물은 양쪽 가장자리에 더 자주
const SHORT = { grass, basil, pilea, rosemary, pothos }
const TALL = { sansevieria, birdOfParadise, monstera }
const NEUTRAL = { olive, bostonFern, asparagusFern, calathea }
const BIG_BACK = { monsteraAlbo, strelitziaNicolai, dracaena, kentiaPalm, fiddleLeafFig, luckyBamboo, papyrus, alocasia, zzPlant, miscanthus }
export const SOURCES = { ...SHORT, ...TALL, ...NEUTRAL, ...BIG_BACK }

import { BACKDROP, CENTER, FIELD, FILL_SPOTS, LAYERS, LOOK, TALL_BACK } from './heroConfig.js'

const rnd = (a, b) => a + Math.random() * (b - a)
const pickFrom = (obj) => {
  const keys = Object.keys(obj)
  return keys[Math.floor(Math.random() * keys.length)]
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const DEG = Math.PI / 180

function pickKind(x, W) {
  // 0 = 화면 가운데, 1 = 가장자리
  const edge = Math.min(1, Math.abs(x - W / 2) / (W / 2))
  const wShort = 1 + 2.5 * (1 - edge)
  const wTall = 0.2 + 2.5 * edge
  const wNeutral = 1
  let r = Math.random() * (wShort + wTall + wNeutral)
  if ((r -= wShort) < 0) return pickFrom(SHORT)
  if ((r -= wTall) < 0) return pickFrom(TALL)
  return pickFrom(NEUTRAL)
}

// 위쪽 윤곽선을 언덕처럼: 낮은 주파수 사인을 겹쳐 0~1 값
function makeHill() {
  const p = [rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28)]
  return (t) => {
    const v = 0.5 + 0.28 * Math.sin(t * 6.28 * 1.2 + p[0]) + 0.14 * Math.sin(t * 6.28 * 2.9 + p[1]) + 0.08 * Math.sin(t * 6.28 * 6.3 + p[2])
    return clamp(v, 0, 1)
  }
}

// layer: { gain, lag, scale, alpha }, tipFrac: 끝 높이(화면 위에서 비율)
function makePlant(layer, layerIndex, x, H, name, bitmaps, baseRange, tipFrac) {
  const img = bitmaps[name]
  const aspect = img ? img.width / img.height : 0.65
  const baseY = H * rnd(baseRange[0], baseRange[1])
  // 크기 배율(scale)은 밑동을 기준으로 키를 늘리거나 줄임
  const h = (baseY - tipFrac * H) * (layer.scale ?? 1)
  return {
    layer,
    layerIndex,
    name,
    x,
    baseY,
    h,
    w: h * aspect,
    flip: Math.random() < 0.5 ? -1 : 1,
    phase: rnd(0, Math.PI * 2),
    // 그루마다 색 변화: 색조 ±10°, 채도 ±15%, 밝기 ±12%
    color: [rnd(-10, 10) * DEG, rnd(-0.15, 0.15), rnd(-0.12, 0.12)],
    bend: 0,
    vel: 0,
  }
}

// layerIndex: 0 맨 뒤 키 큰 식물 · 1 가운데 큰 잎 · 2 뒤 · 3 중간 · 4 앞 (이 순서로 그림)
export function buildField(W, H, bitmaps) {
  const plants = []
  const ratio = W / 1440
  const hill = makeHill()

  // 맨 뒤에 크고 옅게 세운 키 큰 식물 — 가로 전체에 고르게, 화면 위쪽까지 올라옴
  const tallLayer = { gain: TALL_BACK.gain, lag: 0.05, scale: TALL_BACK.scale, alpha: LOOK.tallBack.alpha }
  const tallN = Math.max(3, Math.round(TALL_BACK.count * ratio))
  const tallCell = (1.1 * W) / tallN
  const kinds = [...TALL_BACK.kinds].sort(() => Math.random() - 0.5)
  for (let i = 0; i < tallN; i++) {
    const x = -0.05 * W + tallCell * (i + 0.5) + rnd(-0.35, 0.35) * tallCell
    const name = kinds[i % kinds.length]
    plants.push(makePlant(tallLayer, 0, x, H, name, bitmaps, [1.02, 1.08], rnd(TALL_BACK.tip[0], TALL_BACK.tip[1])))
  }

  // 가운데 뒤에 옅게 비치는 큰 잎 식물
  const centerLayer = { gain: CENTER.gain, lag: 0.06, scale: CENTER.scale, alpha: LOOK.center.alpha }
  const centerCount = Math.round(rnd(CENTER.count[0], CENTER.count[1] + 0.99) - 0.49)
  const [a0, a1] = CENTER.area
  for (let i = 0; i < centerCount; i++) {
    const x = W * (a0 + ((a1 - a0) * (i + 0.5)) / centerCount) + rnd(-0.04, 0.04) * W
    const name = CENTER.kinds[i % CENTER.kinds.length]
    const base = [1.02, 1.06]
    const tipFrac = rnd(base[0], base[1]) - rnd(CENTER.height[0], CENTER.height[1])
    plants.push(makePlant(centerLayer, 1, x, H, name, bitmaps, base, tipFrac))
  }

  LAYERS.forEach((cfg, layerNo) => {
    const layer = { ...cfg, alpha: LOOK[cfg.id].alpha }
    const li = layerNo + 2 // 0 맨 뒤 키 큰 식물 · 1 가운데 큰 잎
    // 화면 폭(-5% ~ 105%)을 같은 폭의 칸으로 나누고, 칸마다 1그루를 칸 폭의 ±60% 안에서 흔들어 둠
    const n = Math.max(6, Math.round(cfg.count * ratio))
    const start = -0.05 * W
    const cell = (1.1 * W) / n
    let prevSize = 1
    for (let i = 0; i < n; i++) {
      const x = start + cell * (i + 0.5) + rnd(-0.6, 0.6) * cell
      const atEdge = x < W * 0.15 || x > W * 0.85

      // 양쪽 가장자리에 가끔만 올라오는 키 큰 그루
      if (atEdge && Math.random() < FIELD.edgeTallChance) {
        plants.push(makePlant(layer, li, x, H, pickFrom(TALL), bitmaps, cfg.base, rnd(FIELD.edgeTall[0], FIELD.edgeTall[1])))
        prevSize = 1.5
        continue
      }

      // 크기 리듬: ±sizeJitter, 가끔 아주 크거나 작게, 큰 그루 바로 옆은 작게 → 끝 높이로 반영
      const j = FIELD.sizeJitter
      let size
      if (prevSize > 1.2) size = rnd(0.5, 0.8)
      else if (Math.random() < 0.1) size = Math.random() < 0.5 ? rnd(1.55, 1.75) : rnd(0.4, 0.5)
      else size = rnd(1 - j, 1 + j)
      prevSize = size

      // 언덕 모양 윤곽 + 크기 리듬 + 겹 차이
      const [t0, t1] = FIELD.tip
      const tip = t1 - (t1 - t0) * hill((x + 0.05 * W) / (1.1 * W)) - (size - 1) * 0.06 + cfg.tipShift + rnd(-0.02, 0.02)
      plants.push(makePlant(layer, li, x, H, pickKind(x, W), bitmaps, cfg.base, clamp(tip, t0, t1)))
    }
  })

  // 빈자리 채우기: 정해진 자리에 항상 식물을 세움 (FILL_SPOTS)
  FILL_SPOTS.forEach((spot) => {
    const layerNo = Math.max(0, LAYERS.findIndex((l) => l.id === spot.layer))
    const cfg = LAYERS[layerNo]
    const layer = { ...cfg, alpha: LOOK[cfg.id].alpha }
    spot.kinds.forEach((name, k) => {
      if (!bitmaps[name] && Object.keys(bitmaps).length) return
      const side = k % 2 === 0 ? 1 : -1
      const x = W * (spot.x + side * spot.spread * Math.ceil(k / 2))
      const tip = spot.tip + spot.step * k
      plants.push(makePlant(layer, layerNo + 2, x, H, name, bitmaps, cfg.base, tip))
    })
  })

  plants.sort((a, b) => a.layerIndex - b.layerIndex)
  return plants
}

// 맨 뒤 정지된 흐릿한 숲 — 바람 · 스크롤에 반응하지 않음. 크기가 바뀔 때만 한 번 그림
// 배경색 70% 섞기 · 채도 -50% · 흐림 · 불투명도(BACKDROP)
export function drawBackdrop(canvas, W, H, bitmaps) {
  canvas.width = Math.round(W)
  canvas.height = Math.round(H)
  canvas.style.opacity = BACKDROP.opacity
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  const names = Object.keys(bitmaps)
  if (!names.length) return
  const n = Math.round(BACKDROP.count * (W / 1440))
  const cell = (1.1 * W) / n
  ctx.filter = `saturate(50%) blur(${BACKDROP.blur}px)`
  for (let i = 0; i < n; i++) {
    const x = -0.05 * W + cell * (i + 0.5) + rnd(-0.5, 0.5) * cell
    const name = names[Math.floor(Math.random() * names.length)]
    const img = bitmaps[name]
    const baseY = H * rnd(1.0, 1.05)
    const h = (baseY - H * rnd(BACKDROP.tip[0], BACKDROP.tip[1])) * BACKDROP.scale
    const w = h * (img.width / img.height)
    ctx.save()
    ctx.translate(x, baseY)
    if (Math.random() < 0.5) ctx.scale(-1, 1)
    ctx.drawImage(img, -w / 2, -h, w, h)
    ctx.restore()
  }
  ctx.filter = 'none'
  // 그린 식물 위에만 배경색 #EAF3DC를 70% 섞음
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = 'rgba(234, 243, 220, 0.7)'
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'
}

// 사진을 미리 줄여 두어 매 프레임 그리기를 가볍게
export async function loadBitmaps() {
  const entries = await Promise.all(
    Object.entries(SOURCES).map(
      ([name, src]) =>
        new Promise((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = async () => {
            try {
              const bmp = await createImageBitmap(img, { resizeHeight: 640, resizeQuality: 'high' })
              resolve([name, bmp])
            } catch {
              resolve([name, img])
            }
          }
          img.onerror = () => resolve([name, null])
          img.src = src
        }),
    ),
  )
  return Object.fromEntries(entries.filter(([, v]) => v))
}

export function drawField(ctx, plants, bitmaps, off) {
  for (const p of plants) {
    const img = bitmaps[p.name]
    if (!img) continue
    ctx.save()
    ctx.globalAlpha = p.layer.alpha
    ctx.translate(p.x, p.baseY + off)
    // 사진 한 장을 통째로 기울이므로 휘는 각도는 절반으로
    ctx.rotate(p.bend * 0.5)
    ctx.scale(p.flip, 1)
    ctx.drawImage(img, -p.w / 2, -p.h, p.w, p.h)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}
