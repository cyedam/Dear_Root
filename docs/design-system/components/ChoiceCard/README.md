# ChoiceCard

체험 질문의 답을 그림과 함께 고르는 카드입니다.

- 4열 그리드, 간격 24. 안쪽 여백 24, 모서리 `radius-xl`, 바탕 `white`.
- 위에 일러스트 자리(`radius-lg`), 이름 `title-sm` 18/600, 설명 16/1.6 `ink-muted`.
- 선택 전: 2px `line` 테두리. 선택: 2px `leaf-green` + `shadow-selected`.
- hover 위로 2px + `shadow-hover`, 누르면 `scale(0.98)`.
- 하나만 고르면 `role="radio"` / 여럿 고르면 `role="checkbox"` + `aria-checked`. 여럿 고르는 질문만 '다음' 버튼이 생깁니다.
- '잘 모르겠어요'를 늘 마지막에 둡니다.
