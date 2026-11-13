// 케어 제품 목록 — P2 추천 케어와 P3 케어 제품이 함께 씀 (출처: 99-care-quiz.md 5. 상품 구성, P3 디자인)
import soilFoliage from '../assets/P3/product-soil-foliage-photo.jpg'
import soilSucculent from '../assets/P3/product-soil-succulent-photo.jpg'
import soilFlowerHerb from '../assets/P3/product-soil-flower-herb-photo.jpg'
import soilFruit from '../assets/P3/product-soil-fruit-photo.jpg'
import soilOrchid from '../assets/P3/product-soil-orchid-bark-photo.jpg'
import soilDrainage from '../assets/P3/product-soil-drainage-photo.jpg'
import nutrientRoot from '../assets/P3/product-nutrient-root-photo.jpg'
import nutrientGrowth from '../assets/P3/product-nutrient-growth-photo.jpg'
import nutrientBloom from '../assets/P3/product-nutrient-bloom-photo.jpg'
import nutrientBasic from '../assets/P3/product-nutrient-basic-photo.jpg'
import setOverwater from '../assets/P3/set-overwater-recovery-photo.jpg'
import setRepotting from '../assets/P3/set-repotting-basic-photo.jpg'
import setSucculent from '../assets/P3/set-succulent-photo.jpg'

// 가격: 임시 금액 (답변 2026-11-13). 세트는 따로 살 때보다 약 10% 저렴
export function formatPrice(won) {
  return `${won.toLocaleString('ko-KR')}원`
}

export const SOILS = [
  { name: '관엽용 흙', desc: '초록 잎 식물을 위한 기본 흙', price: 12000, image: soilFoliage },
  { name: '다육용 흙', desc: '물이 빠르게 빠지는 흙', price: 13000, image: soilSucculent },
  { name: '화초용 흙', desc: '꽃 피는 식물과 허브에', price: 12000, image: soilFlowerHerb },
  { name: '과실수용 흙', desc: '열매 맺는 식물에', price: 14000, image: soilFruit },
  { name: '난초용 바크', desc: '', price: 15000, image: soilOrchid },
  { name: '배수 잘 되는 흙', desc: '물이 고이지 않게 흙 사이에 숨구멍을 만들어 줘요.', price: 13000, image: soilDrainage },
]

export const NUTRIENTS = [
  { name: '뿌리 활력제', desc: '지친 뿌리가 다시 힘을 내도록 도와줘요.', price: 9900, image: nutrientRoot },
  { name: '성장 영양제', desc: '', price: 9900, image: nutrientGrowth },
  { name: '개화·결실 영양제', desc: '', price: 11000, image: nutrientBloom },
  { name: '기본 영양제', desc: '', price: 8900, image: nutrientBasic },
]

export const SETS = [
  { name: '과습 회복 세트', desc: '배수 잘 되는 흙 + 뿌리 활력제', price: 21000, image: setOverwater },
  { name: '분갈이 기본 세트', desc: '관엽용 흙 + 성장 영양제', price: 20000, image: setRepotting },
  { name: '다육·선인장 세트', desc: '다육용 흙 + 기본 영양제', price: 20000, image: setSucculent },
]

const ALL = [
  ...SOILS.map((p) => ({ ...p, kind: '흙' })),
  ...NUTRIENTS.map((p) => ({ ...p, kind: '영양제' })),
]

export function findProduct(name) {
  return ALL.find((p) => p.name === name)
}
