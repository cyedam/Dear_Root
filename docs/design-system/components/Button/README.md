# Button

주요 버튼은 핵심 행동 하나에만, 나머지는 흰 바탕 테두리 버튼으로 둡니다.

| 종류 | 모양 | 쓰는 곳 |
|---|---|---|
| Primary | `leaf-green` 채움 + 흰 글자 18/500, `shadow-cta`, hover `leaf-green-hover` | '맞춤 케어 체험 시작', '다음' **만** |
| Secondary | 흰 바탕 + 1.5px `leaf-green` 테두리, 글자 `leaf-green` 16/500, hover `pale-lime` | 구매(제품 구매하기 · 세트 구매 · 구매 · 이 배합으로 구매), 이전 질문, DIY 흙 담기, 케어 가이드 보기, 다시 담기 |
| Scene | 흰 바탕 + 1px 반투명 `ink` 테두리, 글자 `ink`, `shadow-scene` / hover 위로 2px | P1 장면(사진) 위 |

- 크기: 높이 `control-lg` 56 · 폭 `button-width` 260. 카드 안 구매 · 다시 담기는 `control-md` 48.
- 모서리 `radius-pill`. 화살표 아이콘(→ / ←)은 글자 옆 8~10px, 글자색과 같게.
- 누르면 `scale(0.98)`. 비활성은 불투명도 0.4, 그림자 없음.
- **판매 압박 피하기:** 구매 버튼을 Primary로 만들지 않습니다.
