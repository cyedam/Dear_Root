// P4 케어 가이드 내용 (출처: PROJECT_CONTEXT.md 화면 문구 · 04-site-wireframe.md, 벌레 상세: 99-care-quiz.md 4. 벌레 대처 정리)
import watering from '../../assets/P4/guide-watering.jpg'
import sunlight from '../../assets/P4/guide-sunlight.jpg'
import repotting from '../../assets/P4/guide-repotting.jpg'
import bugFungusGnat from '../../assets/P2/bug-fungus-gnat.jpg'
import bugMealybug from '../../assets/P2/bug-mealybug.jpg'
import bugScale from '../../assets/P2/bug-scale.jpg'
import bugSpiderMite from '../../assets/P2/bug-spider-mite.jpg'
import bugAphid from '../../assets/P2/bug-aphid.jpg'
import bugThrips from '../../assets/P2/bug-thrips.jpg'
import bugSpringtail from '../../assets/P2/bug-springtail.jpg'

const TYPES = ['관엽식물', '다육·선인장', '꽃 피는 식물', '허브', '과실 식물', '난초류']
const byType = (texts) => TYPES.map((type, i) => ({ type, text: texts[i] }))

export const CARE_TOPICS = [
  {
    id: 'watering',
    title: '물 주기',
    image: watering,
    text: '겉흙이 손가락 한 마디 깊이까지 말랐을 때, 화분 밑으로 물이 흘러나올 만큼 흠뻑 주세요. 받침에 고인 물은 바로 버려 주세요. 겨울에는 흙이 마르는 속도가 느려지니 간격을 조금 늘려 주세요.',
    types: byType([
      '겉흙이 2~3cm 말랐을 때 흠뻑 주세요. 여름엔 자주, 겨울엔 간격을 늘려 주세요.',
      '흙이 속까지 다 마른 뒤에 흠뻑 주세요. 잎이 살짝 쭈글해지면 물을 줄 때예요. 겨울엔 한 달에 한 번 정도로 줄여 주세요.',
      '겉흙이 마르면 바로 주세요. 꽃과 잎에 물이 닿지 않게 흙에만 주세요.',
      '로즈마리처럼 잎이 단단한 허브는 흙이 마른 뒤에, 바질 · 민트는 겉흙이 마르면 바로 주세요.',
      '꽃이 피고 열매가 맺힐 때는 물이 모자라지 않게, 겉흙이 마르면 흠뻑 주세요.',
      '바크 · 수태가 바싹 마르면 화분째 물에 10~15분 담갔다가 물을 충분히 빼 주세요.',
    ]),
  },
  {
    id: 'sunlight',
    title: '햇빛',
    image: sunlight,
    text: '대부분의 실내 식물은 밝지만 해가 직접 들지 않는 곳을 좋아해요. 다육·선인장은 해가 잘 드는 창가가 좋아요. 잎이 하얗게 바래면 빛이 강한 것이고, 줄기만 길쭉하게 자라면 빛이 부족한 거예요.',
    types: byType([
      '밝지만 해가 직접 들지 않는 곳이 좋아요. 강한 햇빛은 잎을 태울 수 있어요.',
      '하루 4시간 이상 해가 드는 창가가 좋아요.',
      '꽃을 피우려면 빛이 충분해야 해요. 밝은 창가에 두고, 한여름 한낮 햇빛은 커튼으로 걸러 주세요.',
      '하루 5~6시간 해가 드는 가장 밝은 창가에 두세요.',
      '해를 많이 받을수록 열매가 잘 맺혀요. 집에서 가장 해가 잘 드는 곳에 두세요.',
      '커튼 너머로 들어오는 정도의 밝은 빛이 좋아요.',
    ]),
  },
  {
    id: 'repotting',
    title: '분갈이',
    image: repotting,
    text: '화분 밑으로 뿌리가 나오거나 물이 잘 안 빠지면 분갈이할 때예요. 봄이나 가을에 지금보다 한 치수 큰 화분으로 옮겨 주세요. 분갈이한 뒤 일주일 정도는 직사광선을 피해 쉬게 해 주세요.',
    types: byType([
      '1~2년에 한 번, 봄에 한 치수 큰 화분으로 옮겨 주세요.',
      '2~3년에 한 번, 봄에 옮겨 주세요. 분갈이한 뒤 일주일 정도는 물을 주지 않아요.',
      '꽃이 진 뒤에 옮겨 주세요. 꽃이 피어 있을 때는 피해 주세요.',
      '뿌리가 빨리 자라서 1년에 한 번, 봄에 옮겨 주세요.',
      '2~3년에 한 번, 새순이 나기 전 이른 봄에 옮겨 주세요.',
      '2년에 한 번 꽃이 진 뒤, 바크 · 수태를 새것으로 바꿔 주세요. 흙에는 심지 않아요.',
    ]),
  },
]

export const BUGS = [
  { name: '뿌리파리', look: '화분 주변을 나는 작은 날파리', action: '겉흙을 말리고 노란 끈끈이 트랩을 꽂아 주세요.', severe: '흙에 물처럼 주는 뿌리파리용 살충제 사용, 분갈이로 흙 교체', prevent: '겉흙이 마른 뒤 물 주기, 겉흙을 마사토로 덮기', image: bugFungusGnat },
  { name: '솜깍지벌레', look: '잎과 줄기 틈의 하얀 솜 뭉치', action: '소독용 알코올을 묻힌 면봉으로 닦아 내 주세요.', severe: '식물 전체에 퍼지는 침투성 살충제 사용', prevent: '잎 틈 자주 살피기, 통풍', image: bugMealybug },
  { name: '깍지벌레', look: '줄기에 붙은 갈색 딱지', action: '칫솔로 살살 긁어 내고 알코올로 닦아 주세요.', severe: '침투성 살충제 사용', prevent: '통풍, 새로 들인 식물은 2주 정도 따로 두기', image: bugScale },
  { name: '응애', look: '잎 뒷면의 거미줄과 아주 작은 점', action: '샤워기로 잎 앞뒤를 씻고 주변 습도를 높여 주세요.', severe: '응애 전용 약제 사용 (일반 살충제는 잘 안 들어요)', prevent: '잎 뒷면에 물 뿌리기, 건조한 바람 피하기', image: bugSpiderMite },
  { name: '진딧물', look: '새순에 모인 작은 초록·검은 벌레', action: '물로 씻어 내거나 손으로 떼어 내 주세요.', severe: '식물용 비눗물·님오일 같은 친환경 약제, 그래도 남으면 살충제', prevent: '새순 자주 살피기, 통풍', image: bugAphid },
  { name: '총채벌레', look: '잎의 은빛 긁힌 자국과 검은 점', action: '잎을 샤워기로 씻고 파란 끈끈이 트랩을 걸어 주세요.', severe: '총채벌레용 살충제를 일주일 간격으로 2~3번', prevent: '통풍, 잎 자주 닦기', image: bugThrips },
  { name: '톡토기', look: '흙 위를 톡톡 뛰는 하얀 작은 벌레', action: '흙 속 찌꺼기를 분해하는 익충이에요. 그대로 두어도 괜찮아요.', severe: '필요 없음', prevent: '과습 피하기', image: bugSpringtail, helpful: true },
]

// 답변이 정해지지 않은 질문은 answer: null (화면에 '답변 자리 [미정]'으로 표시)
export const FAQS = [
  { q: '물을 얼마나 자주 줘야 하나요?', answer: '날짜보다 흙 상태를 봐 주세요. 겉흙이 손가락 한 마디 깊이까지 말랐을 때 흠뻑 주면 돼요.' },
  {
    q: '잎 끝이 갈색으로 마르는데 괜찮을까요?',
    answer:
      '걱정하지 않아도 괜찮아요. 물이 조금 모자랐거나, 에어컨 · 난방 바람이나 창가 냉기가 잎에 직접 닿을 때 자주 생겨요. 겉흙이 너무 오래 말라 있지 않았는지 살펴보고, 바람이 직접 닿지 않는 곳으로 옮겨 주세요. 이미 마른 끝은 깨끗한 가위로 살짝 잘라 내도 돼요.',
  },
  {
    q: '분갈이한 뒤 식물이 축 처졌어요.',
    answer:
      '뿌리가 새 흙에 자리 잡는 동안 잠깐 힘이 없어 보일 수 있어요. 일주일 정도는 해가 직접 들지 않는 밝은 곳에서 쉬게 해 주고, 겉흙이 마르면 물을 주세요. 다육 · 선인장은 분갈이한 뒤 일주일 정도 물을 주지 않아요. 대부분 1~2주 안에 다시 기운을 차려요.',
  },
  {
    q: 'DIY 흙은 어떤 비율로 담으면 좋을까요?',
    answer:
      '관엽식물이라면 상토 6에 펄라이트 · 마사토 같은 배수 재료 4 정도가 기본이에요. 다육 · 선인장은 배수 재료를 6 이상, 난초류는 바크를 6 이상 담아 주세요. 물을 좋아하는 식물은 코코피트 · 질석을 조금 더 넣으면 촉촉함이 오래가요. 담을 때마다 결과 막대로 바로 확인할 수 있어요.',
  },
]
