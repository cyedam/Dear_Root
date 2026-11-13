// P2 맞춤 케어 체험 — 질문 · 결과 규칙 (출처: P2 디자인, 99-care-quiz.md)
import { findProduct } from '../../data/products.js'

// 이미지: src/assets/P2 (파일 이름 → URL)
const IMAGES = import.meta.glob('../../assets/P2/*.jpg', { eager: true, import: 'default' })
const img = (name) => IMAGES[`../../assets/P2/${name}.jpg`]

export const STEP_NAMES = ['식물 종류', '증상·벌레', '환경']
export const TOTAL = 7

function seasonNow() {
  const m = new Date().getMonth() + 1
  if (m >= 3 && m <= 5) return '봄'
  if (m >= 6 && m <= 8) return '여름'
  if (m >= 9 && m <= 11) return '가을'
  return '겨울'
}

const opt = (v, name, image, desc = '') => ({ v, name, desc, image: img(image) })

export const INITIAL_ANSWERS = {
  type: null,
  symptom: [],
  bug: [],
  light: null,
  water: null,
  temp: null,
  repot: null,
}

export function getQuestions(ans) {
  const showBud = ans.type === 'flower' || ans.type === 'fruit'
  const symptoms = [
    opt('yellow', '잎이 노랗게 변해요', 'quiz-q2-yellow-leaves'),
    opt('lowerYellow', '아래쪽 잎부터 노래지며 떨어져요', 'quiz-q2-lower-leaves-drop'),
    opt('spots', '잎에 갈색·검은 반점이 생겼어요', 'quiz-q2-leaf-spots'),
    opt('tipDry', '잎 끝이 갈색으로 바싹 말라요', 'quiz-q2-brown-tips'),
    opt('bleached', '잎이 하얗게 바래거나 탄 자국이 있어요', 'quiz-q2-sun-scorch'),
    opt('droop', '잎이 축 처지고 힘이 없어요', 'quiz-q2-drooping'),
    opt('wrinkle', '잎이 쭈글쭈글하고 얇아졌어요', 'quiz-q2-wrinkled'),
    opt('leggy', '줄기만 길쭉하게 웃자라요', 'quiz-q2-leggy'),
    opt('noNew', '새잎이 안 나거나 작게 나와요', 'quiz-q2-no-new-growth'),
    opt('rot', '줄기 밑동이 물러지고 냄새가 나요', 'quiz-q2-stem-rot'),
    opt('mold', '흙 위에 하얀 곰팡이가 생겼어요', 'quiz-q2-soil-mold'),
    opt('rootsOut', '화분 밑 구멍으로 뿌리가 나와요', 'quiz-q2-roots-out'),
  ]
  if (showBud) symptoms.push(opt('budDrop', '꽃봉오리나 열매가 떨어져요', 'quiz-q2-bud-drop'))
  symptoms.push(opt('none', '딱히 문제는 없어요', 'quiz-q2-no-problem'))

  return [
    {
      id: 'type', step: 1, multi: false,
      title: '어떤 식물을 키우고 계세요?',
      sub: '가장 비슷한 카드를 골라 주세요. 잘 몰라도 괜찮아요.',
      opts: [
        opt('foliage', '관엽식물', 'quiz-q1-foliage', '잎을 보며 키우는 초록 식물'),
        opt('succulent', '다육·선인장', 'quiz-q1-succulent', '잎이나 줄기가 통통한 식물'),
        opt('flower', '꽃 피는 식물', 'quiz-q1-flowering', '꽃을 보기 위해 키우는 식물'),
        opt('herb', '허브', 'quiz-q1-herb', '향이 나고 잎을 쓰기도 하는 식물'),
        opt('fruit', '과실 식물', 'quiz-q1-fruit', '열매가 열리는 식물'),
        opt('orchid', '난초류', 'quiz-q1-orchid', '흙 대신 바크·수태에 심는 식물'),
        opt('unknown', '잘 모르겠어요', 'quiz-q1-unsure', '관엽식물 기준으로 함께 볼게요'),
      ],
    },
    {
      id: 'symptom', step: 2, multi: true, none: 'none',
      title: '요즘 식물이 어떤 신호를 보내나요?',
      sub: '해당되는 증상을 모두 골라보세요.',
      opts: symptoms,
    },
    {
      id: 'bug', step: 2, multi: true, none: 'nobug',
      title: '혹시 이런 벌레가 보이나요?',
      sub: '해당되는 상황을 모두 골라보세요.',
      opts: [
        opt('gnat', '작은 날파리가 화분 주변을 날아다녀요', 'bug-fungus-gnat'),
        opt('mealybug', '잎이나 줄기에 하얀 솜 같은 게 붙어 있어요', 'bug-mealybug'),
        opt('scale', '줄기에 갈색 딱지가 붙어 있어요', 'bug-scale'),
        opt('mite', '잎 뒷면에 거미줄과 아주 작은 점이 있어요', 'bug-spider-mite'),
        opt('aphid', '새순에 작은 초록·검은 벌레가 모여 있어요', 'bug-aphid'),
        opt('thrips', '잎에 은빛 긁힌 자국과 검은 점이 있어요', 'bug-thrips'),
        opt('springtail', '흙 위를 하얀 아주 작은 벌레가 톡톡 뛰어요', 'bug-springtail'),
        opt('nobug', '벌레는 안 보여요', 'quiz-q3-no-bugs'),
      ],
    },
    {
      id: 'light', step: 3, multi: false,
      title: '식물이 있는 곳은 얼마나 밝나요?',
      opts: [
        opt('direct', '해가 직접 드는 밝은 창가', 'quiz-q4-direct-sun'),
        opt('indirect', '밝지만 해가 직접 들지는 않아요', 'quiz-q4-bright-indirect'),
        opt('dark', '빛이 거의 안 들어요', 'quiz-q4-low-light'),
      ],
    },
    {
      id: 'water', step: 3, multi: false,
      title: '물은 어떻게 주고 계세요?',
      opts: [
        opt('often', '흙이 마르기 전에 자주 줘요', 'quiz-q5-often'),
        opt('dry', '겉흙이 마르면 줘요', 'quiz-q5-when-dry'),
        opt('forget', '깜빡해서 오래 못 줄 때가 많아요', 'quiz-q5-forget'),
        opt('unknown', '잘 모르겠어요', 'quiz-q5-unsure'),
      ],
    },
    {
      id: 'temp', step: 3, multi: false,
      title: '식물이 있는 곳의 온도는 어떤가요?',
      season: `지금은 ${seasonNow()}이에요 · 접속한 날짜 기준`,
      opts: [
        opt('warm', '따뜻해요 (20℃ 이상)', 'quiz-q6-warm'),
        opt('cool', '선선해요 (10~20℃)', 'quiz-q6-cool'),
        opt('cold', '추워요 (10℃ 아래, 창가 냉기)', 'quiz-q6-cold'),
        opt('wind', '에어컨이나 난방 바람이 직접 닿아요', 'quiz-q6-air-vent'),
      ],
    },
    {
      id: 'repot', step: 3, multi: false,
      title: '마지막 분갈이는 언제였나요?',
      opts: [
        opt('within', '1년 안에 했어요', 'quiz-q7-within-year'),
        opt('over', '1년이 넘었거나 한 적이 없어요', 'quiz-q7-over-year'),
        opt('unknown', '잘 모르겠어요', 'quiz-q7-unsure'),
      ],
    },
  ]
}

const SOIL_BY_TYPE = {
  foliage: '관엽용 흙',
  unknown: '관엽용 흙',
  succulent: '다육용 흙',
  flower: '화초용 흙',
  herb: '화초용 흙',
  fruit: '과실수용 흙',
  orchid: '난초용 바크',
}

const BUG_INTRO = '식물을 키우다 보면 벌레가 찾아오는 건 자연스러운 일이에요.'

const BUGS = {
  gnat: { title: '뿌리파리가 보여요', action: '겉흙을 말리고 노란 끈끈이 트랩을 꽂아 주세요.', prods: ['배수 잘 되는 흙'], image: 'bug-fungus-gnat' },
  mealybug: { title: '솜깍지벌레가 보여요', action: '소독용 알코올을 묻힌 면봉으로 닦아 내 주세요.', prods: [], image: 'bug-mealybug' },
  scale: { title: '깍지벌레가 보여요', action: '칫솔로 살살 긁어 내고 알코올로 닦아 주세요.', prods: [], image: 'bug-scale' },
  mite: { title: '응애가 보여요', action: '샤워기로 잎 앞뒤를 씻고 주변 습도를 높여 주세요.', prods: [], image: 'bug-spider-mite' },
  aphid: { title: '진딧물이 보여요', action: '물로 씻어 내거나 손으로 떼어 내 주세요.', prods: [], image: 'bug-aphid' },
  thrips: { title: '총채벌레가 보여요', action: '잎을 샤워기로 씻고 파란 끈끈이 트랩을 걸어 주세요.', prods: [], image: 'bug-thrips' },
  springtail: { title: '톡토기가 보여요', action: '흙 속 찌꺼기를 분해하는 익충이에요. 그대로 두어도 괜찮아요.', prods: [], image: 'bug-springtail', helpful: true },
}

export function getResult(ans) {
  const has = (k) => ans.symptom.includes(k)
  const any = (ks) => ks.some(has)
  const soil = SOIL_BY_TYPE[ans.type] || '관엽용 흙'

  const causes = [
    { id: 'over', sym: ['yellow', 'droop', 'rot', 'mold'], env: ans.water === 'often', image: 'result-overwatering', title: '물이 조금 많았어요', desc: '흙이 오래 젖어 있으면 뿌리가 숨 쉬기 어려워져요. 잎이 노랗게 변한 건 뿌리가 쉴 틈이 필요하다는 신호예요.', action: '겉흙이 손가락 한 마디 깊이까지 마를 때까지 물 주기를 잠시 쉬어 주세요.', prods: ['배수 잘 되는 흙', '뿌리 활력제'] },
    { id: 'under', sym: ['tipDry', 'droop', 'wrinkle'], env: ans.water === 'forget', image: 'result-underwatering', title: '목이 말랐던 것 같아요', desc: '', action: '겉흙이 손가락 한 마디 깊이까지 말랐을 때, 화분 밑으로 물이 흘러나올 만큼 흠뻑 주세요.', prods: [soil] },
    { id: 'temp', sym: ['spots', 'tipDry'], env: ans.temp === 'cold' || ans.temp === 'wind', image: 'result-temperature', title: '온도 변화에 놀랐어요', desc: '', action: '', prods: [] },
    { id: 'dark', sym: ['leggy', 'noNew'], env: ans.light === 'dark', image: 'result-low-light', title: '햇빛이 조금 부족해요', desc: '', action: '밝지만 해가 직접 들지 않는 창가 쪽으로 옮겨 주세요.', prods: [] },
    { id: 'bright', sym: ['bleached'], env: ans.light === 'direct', image: 'result-too-much-sun', title: '햇빛이 조금 강했어요', desc: '', action: '대부분의 실내 식물은 밝지만 해가 직접 들지 않는 곳을 좋아해요.', prods: [] },
    { id: 'food', sym: ['noNew', 'lowerYellow'], env: ans.repot === 'over', image: 'result-low-nutrients', title: '흙의 영양이 다 떨어졌어요', desc: '', action: '봄이나 가을에 지금보다 한 치수 큰 화분으로 옮겨 주세요.', prods: [soil, '성장 영양제'] },
    { id: 'pot', sym: ['rootsOut'], env: true, image: 'result-pot-too-small', title: '화분이 작아졌어요', desc: '', action: '봄이나 가을에 한 치수 큰 화분으로 옮겨 주면 뿌리가 편해져요.', prods: [soil, '뿌리 활력제'] },
    { id: 'bud', sym: ['budDrop'], env: true, image: 'result-bud-drop', title: '환경이 바뀌었거나 영양이 부족해요', desc: '', action: '', prods: ['개화·결실 영양제'] },
  ]

  let hits = causes.filter((c) => any(c.sym) && c.env)
  // 밑동 무름이 있으면 과습을 맨 앞으로
  if (has('rot') && hits.some((c) => c.id === 'over')) {
    hits = [hits.find((c) => c.id === 'over'), ...hits.filter((c) => c.id !== 'over')]
  }
  if (!hits.length) {
    const loose = causes.find((c) => any(c.sym))
    if (loose) hits = [loose]
  }

  const bugs = ans.bug
    .filter((b) => BUGS[b])
    .map((b) => ({
      title: BUGS[b].title,
      desc: BUGS[b].helpful ? BUGS[b].action : `${BUG_INTRO} ${BUGS[b].action}`,
      action: BUGS[b].action,
      prods: BUGS[b].prods,
      image: BUGS[b].image,
    }))

  let primary
  let rest
  if (hits.length) {
    primary = hits[0]
    rest = [...hits.slice(1).map((c) => ({ title: c.title, desc: c.action, image: c.image })), ...bugs]
  } else if (bugs.length) {
    const b = bugs[0]
    primary = { title: b.title, desc: `${BUG_INTRO} 조금만 관리해 주면 더 건강하게 자랄 거예요.`, action: b.action, prods: b.prods, image: b.image }
    rest = bugs.slice(1)
  } else {
    primary = { id: 'ok', title: '잘 키우고 계세요!', desc: '', action: '', prods: ['기본 영양제'], image: 'result-healthy' }
    rest = []
  }

  const names = []
  ;[primary, ...hits.slice(1), ...bugs].forEach((x) =>
    (x.prods || []).forEach((p) => {
      if (!names.includes(p)) names.push(p)
    }),
  )

  return {
    primary: {
      title: primary.title,
      desc: primary.desc || '',
      action: primary.action || '',
      image: img(primary.image),
      showEmphasis: primary.id !== 'ok',
    },
    others: rest.map((r) => ({ title: r.title, desc: r.desc || '', image: img(r.image) })),
    products: names.map(findProduct).filter(Boolean),
  }
}
