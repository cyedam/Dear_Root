# 히어로 실사 식물 이미지 · GPT 프롬프트 세트

> 쓰는 곳: P1 메인 히어로의 바람 인터랙션 (09-codex-hero-task.md, 08-hero-interaction.md)
> 만드는 곳: ChatGPT 이미지 생성
> 저장: `myShop/src/assets/hero/plants/` (파일 이름은 아래 표대로)

## 1. 모든 컷에 똑같이 지킬 조건

한 장면처럼 보이려면 아래가 모든 이미지에서 같아야 합니다.

- **한 그루만**, 화분 · 흙 없이, 줄기 밑동이 이미지 **아래 가운데**에서 깔끔하게 끝남 (코드가 밑동을 고정점으로 씀)
- **옆에서 본 각도**, 눈높이
- **투명 배경** (안 되면 순백 배경 → 나중에 배경 지움)
- **위에서 부드럽게 드는 빛**, 그림자 · 반사광 없음
- **신선하고 밝은 초록**, 노랗거나 시든 잎 없음
- **세로 2:3**, 가능한 한 큰 해상도 (세로 2048px 이상)
- 같은 대화방에서 이어서 만들면 톤이 잘 맞습니다

## 2. 공통 프롬프트 (식물 이름만 바꿔 넣기)

```
Photorealistic studio photograph of a single [PLANT], side view at eye level.
The whole plant is visible, from the base of the stems at the bottom center of the frame to the top leaves.
No pot, no soil, no roots: the stems end cleanly at the bottom edge, centered.
Transparent background (if not possible, pure white #FFFFFF background).
Soft diffused light from above, no cast shadows, no reflections, no props, no text.
Fresh, bright, healthy green leaves with natural detail, sharp focus edge to edge.
Vertical 2:3 aspect ratio, very high resolution.
```

## 3. 식물 12종

| 번호 | 파일 이름 | [PLANT] 에 넣을 말 | 화면에서 맡는 역할 |
|---|---|---|---|
| 01 | `plant-01-monstera.webp` | young monstera deliciosa with 4–5 split leaves on long stems | 앞 겹 큰 잎 |
| 02 | `plant-02-boston-fern.webp` | boston fern with long arching fronds | 가늘게 흩날림 |
| 03 | `plant-03-pothos.webp` | golden pothos with upright vines and heart-shaped leaves | 중간 겹 |
| 04 | `plant-04-sansevieria.webp` | snake plant (sansevieria) with tall upright sword-shaped leaves | 키 큰 세로선 |
| 05 | `plant-05-olive.webp` | small olive tree branch cluster with slender silvery-green leaves | 가는 잎 · 뒤 겹 |
| 06 | `plant-06-pilea.webp` | pilea peperomioides with round coin-shaped leaves on thin stems | 동그란 잎 |
| 07 | `plant-07-calathea.webp` | calathea with broad oval patterned leaves | 앞 겹 넓은 잎 |
| 08 | `plant-08-bird-of-paradise.webp` | young bird of paradise (strelitzia) with two or three large paddle leaves | 가장 큰 잎 (가끔만) |
| 09 | `plant-09-asparagus-fern.webp` | asparagus fern with soft feathery fronds | 부드러운 질감 |
| 10 | `plant-10-rosemary.webp` | rosemary herb plant with upright needle-like stems | 허브 · 가는 선 |
| 11 | `plant-11-basil.webp` | basil herb plant with bright green rounded leaves | 허브 · 밝은 초록 |
| 12 | `plant-12-grass.webp` | tuft of ornamental grass with thin arching blades | 바닥 채우기 |

## 4. 흙 단면 · 정지 이미지

**흙 (`soil.webp`)**
```
Photorealistic cross-section view of rich dark potting soil seen from the side, like looking through a glass wall,
with fine plant roots, small perlite stones and bits of bark, soft even light.
The top edge of the soil is a gentle natural wavy line, everything above it is transparent (or pure white).
Seamless horizontally tileable, wide 3:1 aspect ratio, very high resolution.
```

**정지 이미지 (`hero-fallback.webp`)** — 사이트가 완성되면 실제 화면을 캡처해서 만드는 것을 추천합니다. 따로 만들 경우:
```
Photorealistic wide view of many lush indoor plants (monstera, fern, pothos, snake plant, pilea, herbs, grass)
growing densely side by side from the bottom of the frame, soft pale green background (#EAF3DC),
soft diffused light from above, the center upper area kept airy and open for a headline.
16:9, very high resolution.
```

## 5. 받은 뒤 할 일

1. 배경이 남아 있으면 지우기 (투명 PNG)
2. 밑동이 아래 가운데에 오도록 자르고, 위 · 좌우 여백은 조금만
3. WebP(알파 포함)로 저장, 세로 2048px 기준
4. 잎 색이 06번 문서의 라임 · 리프 그린 톤과 많이 다르면 살짝 맞추기
5. (선택) 뒤 겹용으로 흐린 버전 `plant-xx-blur.webp`

> 1~5번은 이미지를 주시면 Claude가 해 드릴 수 있습니다.
