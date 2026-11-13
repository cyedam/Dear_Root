# SoilMeter

DIY 흙 패널의 계량 부분 — 담은 스쿱 수, 칸, 배수 · 보습 · 영양 막대, 결과 문장을 바로바로 보여 줍니다.

- 패널: `pale-lime`, 안쪽 40, `radius-xl`, 폭 400. 위에 흙 봉투 그림(흰 봉투, `shadow-bag`, 재료 층이 아래부터 쌓임, 오른쪽 눈금 5 · 10).
- 스쿱 수 `number-lg` 32 `leaf-green` + '/ 10 스쿱'. 칸 10개(높이 14, `radius-xs`, 사이 4): 담은 칸은 그 재료 색, 빈 칸은 `white` + `line-strong`.
- 막대: 높이 10, 바탕 `white`, 채움 `leaf-green`, width 0.4s.
- 결과 제목 `display-3` 26 (`aria-live`), 설명 16 `ink-soft`. 아무것도 안 담았으면 '재료를 골라 담아 보세요'.
- '다시 담기' · '이 배합으로 구매'는 Secondary, 비었을 때 비활성.
