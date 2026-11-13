# QuizProgress

맞춤 케어 체험(P2)에서 지금 몇 번째 질문인지 보여 주는 단계 표시와 진행 막대입니다.

- 단계 3개(식물 종류 · 증상·벌레 · 환경), 사이 32. 점 지름 28, 숫자 14.
- 점 색: 지금 단계 `leaf-green` + 흰 숫자 / 지난 단계 `lime` + `leaf-green` / 다음 단계 `pale-lime` + `ink-muted`. 지금 · 지난 단계 라벨은 `leaf-green` 600.
- 오른쪽에 'n / 7' (`leaf-green` 600, `aria-live="polite"`).
- 막대: 높이 8, 바탕 `pale-lime`, 채움 `lime`, width 0.45s `cubic-bezier(.2,.8,.2,1)`. `role="progressbar"`와 값 속성을 함께 둡니다.
