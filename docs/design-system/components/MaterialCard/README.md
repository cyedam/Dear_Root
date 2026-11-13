# MaterialCard

'나만의 흙 만들기'에서 흙 재료를 한 스쿱씩 담고 빼는 카드입니다.

- 4열, 간격 24. 위쪽 전체가 '한 스쿱 담기' 버튼, 아래에 −/수량/+.
- 재료 색 덩어리(56×40, 위가 둥근 모양)는 `soil-*` 토큰. 펄라이트는 밝아서 `soil-perlite-edge` 안쪽 선.
- 담긴 재료: 2px `leaf-green` + `shadow-selected`, 수량 `leaf-green`. 0개: 2px `line`, 수량 `ink-faint`, − 비활성.
- −: 흰 바탕 1.5px `leaf-green` 테두리 / +: `leaf-green` 채움, 둘 다 32 원형. 10스쿱이 차면 + 비활성(불투명도 0.35).
- 담기 버튼은 누르면 `scale(0.97)`. 버튼마다 '상토 한 스쿱 더 담기'처럼 `aria-label`.
