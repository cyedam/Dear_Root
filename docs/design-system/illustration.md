# 일러스트 스타일

> 98-illustration-style.md를 옮겨 왔습니다. 위는 한눈에 보는 요약, 아래는 이미지 생성에 그대로 쓰는 원문 프롬프트입니다.

## 한눈에

- **오가닉 플랫 벡터.** 단순하고 굵은 실루엣, 둥글고 살짝 비대칭인 면 — 손으로 그린 듯하지만 가장자리는 매끈하게.
- **산뜻 · 차분 · 자연스럽게.** 유치하거나 빈티지해 보이지 않게.
- **완전한 단색 면.** 그라데이션, 사실적 그림자, 3D, 광택, 종이 · 캔버스 질감 모두 없음.
- **외곽선 없음.** 필요하면 같은 색의 더 진한 톤으로 가는 선(잎맥, 줄기)만.
- **한 그림에 3~6색**, 밝고 맑은 초록 위주. 흙 색은 흙 · 화분 속 · 뿌리 · 흙 재료에만.

## 일러스트 색

| 색 | 토큰 | 값 | 쓰는 곳 |
|---|---|---|---|
| Leaf Green | `leaf-green` | #2E7D4F | 진한 잎, 잎맥 |
| Medium Green | `illust-medium-green` | #4C9B6A | 중간 잎, 밝은 잎의 잎맥 |
| Fresh Green | `illust-fresh-green` | #8CC56E | 앞쪽 밝은 잎 |
| Lime | `lime` | #C6E07A | 작은 잎, 포인트 |
| Pale Lime | `pale-lime` | #F2F8E6 | 바탕 |
| White | `white` | #FFFFFF | 바탕, 뿌리 선(흙 위) |
| Sand Soil | `sand` | #CDB394 | 흙 면 |
| Deep Soil | `illust-deep-soil` | #9C7F5E | 흙 윗면, 알갱이 |
| Soft Sun Yellow | `illust-sun` | #F4D76B | 햇빛만, 아주 조금 |

P1 화면에서 실제로 쓴 방식: 잎 하나는 같은 모양(`M20 180 C 30 90, 100 30, 185 20 C 175 110, 110 170, 20 180 Z`)을 돌리고 뒤집어 반복, 뒤쪽 잎은 `illust-soft-leaf` #B9D89A를 불투명도 0.55로, 앞쪽 잎에만 잎맥 선 2px. 흙 장면은 `sand` 화분 + `illust-deep-soil` 윗면 띠 + 흰 뿌리 선(불투명도 0.7) + 흙 알갱이 점. 햇빛 장면은 `illust-sun` 원과 기울어진 빛줄기를 불투명도 0.14~0.35로.

## 이미지 생성 프롬프트 (원문)

You are a professional illustrator specializing in organic flat vector illustrations.

Analyze the attached reference images and use their shared visual characteristics as the visual direction for creating new illustrations.

The goal is to create illustrations that feel like a cohesive collection from the same illustration series, rather than generic flat icons or standard clipart.

### 1. Core Visual Style

Create an **Organic Flat Vector Illustration** with the following characteristics:

- Simple, bold, and recognizable silhouettes.
- Soft, rounded, organic shapes with naturally irregular contours.
- Slightly asymmetrical forms that feel hand-drawn rather than mechanically geometric.
- Minimalist visual language with carefully simplified details.
- A charming editorial illustration aesthetic, similar to modern botanical illustrations and contemporary children's book artwork.
- Clean, smooth vector-like edges.

The illustration should feel playful, fresh, calm, natural, and sophisticated without looking overly childish or vintage.

### 2. Shape & Form

- Simplify complex subjects into a few distinctive shapes.
- Use large, solid color areas instead of intricate details.
- Prefer rounded edges, flowing curves, and organic silhouettes.
- Avoid perfectly symmetrical or mechanically uniform shapes.
- Preserve the essential characteristics of the subject while removing unnecessary complexity.
- Allow subtle variations in proportions and contours to create a handmade appearance.

### 3. Color Palette

Use a fresh, bright, nature-inspired palette (Lime White).

Recommended colors:
- Leaf Green: #2E7D4F
- Medium Green: #4C9B6A
- Fresh Green: #8CC56E
- Lime: #C6E07A
- Pale Lime: #F2F8E6
- White: #FFFFFF
- Sand Soil: #CDB394
- Deep Soil: #9C7F5E
- Soft Sun Yellow: #F4D76B (sunlight only, use sparingly)

Color rules:
- Use approximately 3–6 colors per illustration.
- Favor fresh, clear, light greens over dark or muddy greens.
- Use contrasting green shades to distinguish overlapping shapes.
- Use Sand Soil and Deep Soil only for soil, pot contents, roots, and soil materials.
- Keep colors flat and opaque.
- Avoid yellowish cream, beige-heavy, or brown-heavy combinations that feel vintage.
- Avoid excessive saturation and harsh color combinations.
- Maintain a consistent palette across the entire illustration collection.

### 4. Line & Detail Treatment

- Avoid thick black outlines.
- Prefer outline-free silhouettes.
- When necessary, use thin, organic lines in a darker shade of the object's main color.
- Use minimal internal details such as veins, stems, small dots, or simple decorative curves.
- Internal lines should be delicate and understated.
- Details should support the silhouette, never overpower it.

### 5. Lighting, Texture & Shading

- Use completely flat color fills.
- No gradients.
- No realistic shadows.
- No 3D effects.
- No glossy highlights.
- No photographic textures.
- No complex lighting.

The overall appearance should be clean, smooth, and visually consistent.

### 6. Composition

Depending on the requested output:

For individual illustrations:
- Center the subject.
- Keep the entire subject visible.
- Use a clean, uncluttered composition.
- Maintain a consistent visual scale.

For illustration collections:
- Arrange individual elements with balanced spacing.
- Keep each object visually independent.
- Avoid unnecessary overlaps.
- Maintain consistent proportions, colors, and detail density.

For landscape illustrations:
- Build the scene using overlapping organic shapes.
- Separate foreground, middle ground, and background.
- Use simplified silhouettes to create depth without realistic perspective.

### 7. Strict Negative Instructions

Do NOT use:
- Photorealism
- 3D rendering
- Realistic botanical painting
- Watercolor or oil painting
- Complex gradients
- Heavy black outlines
- Excessive details
- Sharp geometric shapes
- Anime or cartoon character aesthetics
- Glossy vector effects
- Realistic lighting and shadows
- Textures that resemble paper, canvas, or grain
- Vintage, retro, or muted beige color moods

### 8. Final Style Direction

The final result must resemble a cohesive collection of modern, minimal, organic flat illustrations.

Think of a combination of:
- Contemporary botanical vector artwork
- Soft editorial illustrations
- Minimalist nature-themed clipart
- Whimsical picture-book landscapes

**Most importantly, prioritize the shape language, color harmony, and visual simplicity of the attached references. Do not merely reproduce their subjects.**

---

### USER INPUT

Subject: [Describe the object, plant, animal, or scene to illustrate]

Composition: [Individual object / Multiple objects / Landscape / Illustration sheet]

Background: [Transparent / White #FFFFFF / Pale lime #F2F8E6 / Custom color]

Aspect Ratio: [Specify desired ratio]

Output Format: [SVG / PNG / Other]

Generate the illustration while strictly maintaining the visual style described above.
