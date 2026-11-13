/*
 * ─────────────────────────────────────────────
 *  메인 히어로 조절판 — 여기 숫자만 바꾸면 됩니다
 * ─────────────────────────────────────────────
 *  · 저장하면 개발 서버(npm run dev) 화면에 바로 반영돼요.
 *  · 높이 · 위치는 '화면 높이 대비 비율'이에요. 0 = 화면 맨 위, 1 = 화면 맨 아래.
 *    예) tip: [0.6, 0.8] → 식물 끝이 화면 위에서 60~80% 사이에 옴. 숫자가 작을수록 키가 커요.
 *  · [a, b] 는 'a ~ b 사이에서 무작위'라는 뜻이에요.
 */

// ── 1. 움직이는 식물 3겹 (뒤 · 중간 · 앞) ─────────────────
export const LAYERS = [
  {
    id: 'back',
    count: 40, // 1440px 화면 기준 그루 수 (화면 폭에 비례해 늘고 줄어요)
    scale: 1, // 크기 배율 — 1.2 = 20% 크게, 0.8 = 20% 작게
    base: [1.0, 1.04], // 밑동 위치 (1보다 크면 화면 아래 밖 → 잘린 줄기가 안 보임)
    tipShift: -0.03, // 끝 높이 보정 — 음수면 이 겹만 조금 더 키 크게
    gain: 0.4, // 바람에 반응하는 세기
    lag: 0.06, // 바람을 따라가는 빠르기
  },
  { id: 'mid', count: 45, scale: 1, base: [1.02, 1.07], tipShift: 0, gain: 0.7, lag: 0.09 },
  { id: 'front', count: 25, scale: 1, base: [1.05, 1.1], tipShift: 0.02, gain: 1, lag: 0.12 },
]

// 식물 끝 높이 (모든 겹 공통)
export const FIELD = {
  tip: [0.6, 0.8], // 대부분의 식물 끝 — 화면 위에서 60~80%
  edgeTall: [0.4, 0.5], // 양쪽 가장자리의 가끔 키 큰 그루
  edgeTallChance: 0.37, // 가장자리(양쪽 15%)에 있는 식물이 키 큰 그루가 될 확률
  sizeJitter: 0.35, // 이웃끼리 크기 차이 (±35%)
}

// ── 2. 가운데 뒤에 옅게 비치는 큰 잎 식물 ─────────────────
export const CENTER = {
  count: [4, 6], // 그루 수
  area: [0.3, 0.7], // 가로 위치 범위 (화면 폭 비율)
  height: [0.55, 0.75], // 키 (화면 높이 비율)
  scale: 1, // 크기 배율
  kinds: ['monstera', 'birdOfParadise', 'calathea'],
  gain: 0.3, // 바람 반응 (약하게)
}

// ── 2-1. 맨 뒤에 크고 옅게 세운 키 큰 식물 (13~22번) — 화면 위쪽 빈 곳을 채움 ─────
export const TALL_BACK = {
  count: 8, // 1440px 기준 그루 수
  tip: [0.06, 0.3], // 끝 높이 — 화면 위에서 6~30%까지 올라옴 (작을수록 키 큼)
  scale: 1, // 크기 배율
  gain: 0.2, // 바람 반응 (아주 약하게)
  kinds: [
    'monsteraAlbo',
    'strelitziaNicolai',
    'dracaena',
    'kentiaPalm',
    'fiddleLeafFig',
    'luckyBamboo',
    'papyrus',
    'alocasia',
    'zzPlant',
    'miscanthus',
  ],
}

// ── 2-2. 빈자리 채우기 — 정해진 자리에 항상 식물을 세움 ─────────────────
//  x: 가로 위치(화면 폭 비율) · tip: 첫 그루 끝 높이(화면 위에서) · kinds: 세울 식물(앞에서부터)
//  layer: 어느 겹 느낌으로 그릴지 ('back' 옅게 · 'mid' 보통 · 'front' 진하게)
//  두 번째 그루부터는 옆으로 조금씩(spread) 비켜서, 조금씩 낮게(step) 세움
export const FILL_SPOTS = [
  // 한 그루씩만 — 다른 식물로 바꾸려면 kinds를 바꿔요 (13 monsteraAlbo, 15 dracaena, 20 alocasia 등 TALL_BACK.kinds 이름)
  { x: 0.28, tip: 0.46, kinds: ['alocasia'], layer: 'mid', spread: 0.035, step: 0.08 }, // 왼쪽 빈자리 (20번)
  { x: 0.8, tip: 0.3, kinds: ['dracaena'], layer: 'mid', spread: 0.035, step: 0.1 }, // 오른쪽 빈자리 (15번)
  { x: 0.11, tip: 0.14, kinds: ['papyrus'], layer: 'mid', spread: 0.035, step: 0.08 }, // 왼쪽 위 빈자리 (19번)
  { x: 0.86, tip: 0.12, kinds: ['monsteraAlbo'], layer: 'mid', spread: 0.035, step: 0.08 }, // 오른쪽 위 빈자리 (13번)
]

// ── 3. 맨 뒤 정지된 흐릿한 숲 ─────────────────
export const BACKDROP = {
  count: 30, // 1440px 기준 그루 수
  tip: [0.35, 0.55], // 끝 높이
  scale: 1, // 크기 배율
  blur: 18, // 흐림(px)
  opacity: 0.35,
}

// ── 4. 겹별 색 · 흐림 (WebGL) ─────────────────
//  mix: 배경색 섞기(0~1, 클수록 멀어 보임) · sat: 채도 · bright: 밝기 · alpha: 불투명도
export const LOOK = {
  tallBack: { mix: 0.6, sat: -0.35, bright: 0.05, alpha: 0.5 }, // 맨 뒤 키 큰 식물 (크고 옅게)
  center: { mix: 0.55, sat: -0.3, bright: 0, alpha: 0.45 },
  back: { mix: 0.5, sat: -0.35, bright: 0.1, alpha: 0.75 },
  mid: { mix: 0.2, sat: -0.12, bright: 0, alpha: 0.95 },
  front: { mix: 0, sat: 0.08, bright: -0.06, alpha: 1 },
}

// ── 5. 장면 ① 흙 ─────────────────
export const SOIL = {
  top: 0.84, // 흙 이미지 윗변 위치 (화면 위에서) — 장면 이동(-26px)까지 더해 흙 윗선이 약 82~85%에 옴
}

// ── 6. 장면 ② 햇빛 ─────────────────
export const SUN = {
  background: '#FFFDF2', // 햇빛 장면 배경 (거의 흰 따뜻한 빛)
  warmColor: '255, 245, 157', // 배경에 도는 빛 색 (R, G, B) — 레몬옐로
  warmStrength: 0, // 배경에 도는 빛 세기 (0 = 배경은 물들지 않음)
  warmReach: 65, // 배경 빛이 퍼지는 범위 (%)
  glowCenter: [0.85, -0.05], // 빛이 들어오는 자리 (가로, 세로 비율)
  glowRadius: 0.7, // 흰 큰 빛 반지름 (화면 대각선 비율)
  glowStrength: 0.45, // 흰 큰 빛 세기

  // 식물 위로 드는 빛줄기 (식물에만 비침, 배경은 그대로) — 흰빛 + 레몬옐로
  plantLight: {
    strength: 0.55, // 세기 (0 = 없음, 1 = 아주 밝음)
    colorA: '#FFFFFF', // 빛 색 ① 흰빛
    colorB: '#FFF27A', // 빛 색 ② 레몬옐로
    mix: 0.45, // 두 색의 비율 (0 = 흰빛만, 1 = 레몬옐로만)
    shafts: 7, // 빛줄기 가닥 수
    reach: 1.1, // 빛이 닿는 거리 (화면 대각선 비율)
    speed: 0.25, // 빛줄기가 천천히 일렁이는 빠르기
  },

  // 화면 위에 옅게 깔리는 빛줄기 (SideRays) — 식물 위로 비침, 배경은 거의 물들지 않게 약하게
  rayColor: '#FFFFFF', // 색 ① 흰빛
  rayColor2: '#FFF27A', // 색 ② 레몬옐로
  rayBlend: 0.35, // 두 색의 비율 (0 = 흰빛만, 1 = 레몬옐로만)
  rayIntensity: 2.2, // 밝기
  rayGlow: 0.6, // 빛이 들어오는 자리의 밝기
  raySaturation: 1, // 색 진하기
  rayOpacity: 0.55, // 전체 불투명도 (0~1)
  rayLightMode: true, // 밝은 배경용
  rayDensity: 5, // 가닥 수 느낌

  plantBoost: 0.15, // 햇빛 장면에서 식물 밝기 +15%
}

