// P3-S1 DIY 흙 만들기 — 재료 · 결과 규칙 (출처: P3 디자인, PROJECT_CONTEXT 5. 인터랙션)
import pottingSoil from '../../assets/P3/diy-potting-soil-photo.jpg'
import leafMold from '../../assets/P3/diy-leaf-mold-photo.jpg'
import cocoCoir from '../../assets/P3/diy-coco-coir-photo.jpg'
import vermiculite from '../../assets/P3/diy-vermiculite-photo.jpg'
import perlite from '../../assets/P3/diy-perlite-photo.jpg'
import masato from '../../assets/P3/diy-masato-photo.jpg'
import bark from '../../assets/P3/diy-bark-photo.jpg'
import riceHullCharcoal from '../../assets/P3/diy-rice-hull-charcoal-photo.jpg'

// 한 봉 6L = 10스쿱 (1스쿱 0.6L)
export const MAX_SCOOPS = 10
export const LITERS_PER_SCOOP = 0.6

export const MATERIALS = [
  { id: 'sangto', name: '상토', desc: '영양과 보습을 함께', color: 'var(--soil-sangto)', image: pottingSoil },
  { id: 'buyeop', name: '부엽토', desc: '양분이 많아요', color: 'var(--soil-buyeop)', image: leafMold },
  { id: 'coco', name: '코코피트', desc: '물을 오래 머금어요', color: 'var(--soil-coco)', image: cocoCoir },
  { id: 'jilseok', name: '질석', desc: '물과 양분을 붙잡아요', color: 'var(--soil-jilseok)', image: vermiculite },
  { id: 'perlite', name: '펄라이트', desc: '숨구멍을 만들어요', color: 'var(--soil-perlite)', light: true, image: perlite },
  { id: 'masa', name: '마사토', desc: '물이 잘 빠져요', color: 'var(--soil-masa)', image: masato },
  { id: 'bark', name: '바크', desc: '공기가 잘 통해요', color: 'var(--soil-bark)', image: bark },
  { id: 'hun', name: '훈탄', desc: '뿌리 썩음을 줄여요', color: 'var(--soil-huntan)', image: riceHullCharcoal },
]

export const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((m) => [m.id, m]))

export function countBy(seq) {
  const cnt = Object.fromEntries(MATERIALS.map((m) => [m.id, 0]))
  seq.forEach((id) => {
    cnt[id] += 1
  })
  return cnt
}

// 결과 문구는 항상 비율이 가장 높은 막대(배수 · 보습 · 영양) 기준
const RESULT_BY_TOP = {
  drain: { title: '물이 잘 빠져요. 배수용 흙에 적합해요', desc: '다육·선인장이나 과습이 걱정되는 식물에 잘 맞아요.' },
  moist: { title: '촉촉함을 오래 지켜요. 물을 좋아하는 식물에 적합해요', desc: '물을 좋아하는 관엽식물에 잘 맞아요.' },
  food: { title: '영양이 풍부해요. 영양이 필요한 식물에 적합해요', desc: '꽃 피는 식물, 과실 식물에 잘 맞아요.' },
}

export function evaluateMix(seq) {
  const t = seq.length
  const cnt = countBy(seq)
  const p = (ids) => (t ? ids.reduce((a, id) => a + cnt[id], 0) / t : 0)

  const sangto = p(['sangto'])
  const values = {
    drain: p(['perlite', 'masa', 'bark', 'hun']),
    moist: p(['coco', 'jilseok']) + sangto / 2,
    food: p(['buyeop']) + sangto / 2,
  }
  const bars = [
    { label: '배수', value: values.drain },
    { label: '보습', value: values.moist },
    { label: '영양', value: values.food },
  ]

  if (!t) return { bars, title: '재료를 골라 담아 보세요', desc: '' }

  // 가장 높은 막대 (같으면 배수 → 보습 → 영양 순)
  const top = ['drain', 'moist', 'food'].reduce((best, k) => (values[k] > values[best] + 1e-9 ? k : best), 'drain')
  // 배수가 가장 높고 그중 바크가 60% 이상이면 난초용으로 더 구체적으로
  if (top === 'drain' && p(['bark']) >= 0.6 - 1e-9) {
    return { bars, title: '공기가 아주 잘 통해요. 난초용 흙에 적합해요', desc: '난초류에 잘 맞아요.' }
  }
  return { bars, ...RESULT_BY_TOP[top] }
}
