import { useState } from 'react'
import {
  LITERS_PER_SCOOP,
  MATERIALS,
  MATERIAL_BY_ID,
  MAX_SCOOPS,
  countBy,
  evaluateMix,
} from './soilMix.js'
import '../../components/Button/Button.css'
import './SoilMixer.css'

const fillStyle = (m) => ({
  background: m.color,
  boxShadow: m.light ? 'inset 0 0 0 1.5px var(--soil-perlite-edge)' : undefined,
})

const TICKS = Array.from({ length: MAX_SCOOPS }, (_, i) => i + 1)

function SoilMixer() {
  // 담은 순서대로 쌓임 (한 칸 = 1스쿱). 처음에는 비어 있음
  const [seq, setSeq] = useState([])
  const total = seq.length
  const full = total >= MAX_SCOOPS
  const cnt = countBy(seq)
  const mix = evaluateMix(seq)

  const add = (id) => {
    if (seq.length < MAX_SCOOPS) setSeq([...seq, id])
  }
  const minus = (id) => {
    const i = seq.lastIndexOf(id)
    if (i < 0) return
    const next = [...seq]
    next.splice(i, 1)
    setSeq(next)
  }

  const potLabel = total
    ? `흙 봉투에 담은 재료: ${MATERIALS.filter((m) => cnt[m.id] > 0)
        .map((m) => `${m.name} ${cnt[m.id]}스쿱`)
        .join(', ')}`
    : '흙 봉투가 비어 있어요'

  return (
    <section id="diy" aria-label="나만의 흙 만들기" className="section diy">
      <div className="diy__head">
        <h1 className="display-1">나만의 흙 만들기</h1>
        <p className="diy__sub">재료를 한 스쿱씩 담아 보세요. 담을 때마다 이 흙이 어떤 식물에 잘 맞는지 바로 알려 드려요.</p>
      </div>

      <div className="diy__layout">
        {/* 왼쪽: 재료 카드 (MaterialCard) */}
        <div className="diy__materials">
          <div className="diy__label-row">
            <span className="diy__label">재료 고르기 · 한 봉 6L, 1스쿱 0.6L</span>
            <span className="diy__hint">한 봉 약 3kg (상토 기준) · 비율은 부피 기준</span>
          </div>
          <div className="material-grid">
            {MATERIALS.map((m) => {
              const n = cnt[m.id]
              const on = n > 0
              return (
                <div key={m.id} className={`material-card card-hover${on ? ' is-selected' : ''}`}>
                  {/* 카드를 눌러도 담기지 않음 — + / − 버튼으로만 조절 */}
                  <div className="material-card__info">
                    <span className="material-card__media">
                      <img src={m.image} alt="" />
                    </span>
                    <span className="material-card__name">{m.name}</span>
                    <span className="material-card__desc">{m.desc}</span>
                  </div>
                  <div className="material-card__stepper">
                    <button
                      type="button"
                      className="stepper-btn stepper-btn--minus"
                      disabled={!on}
                      onClick={() => minus(m.id)}
                      aria-label={`${m.name} 한 스쿱 빼기`}
                    >
                      −
                    </button>
                    <span aria-live="polite" className={`material-card__count${on ? ' is-on' : ''}`}>
                      {n} 스쿱
                    </span>
                    <button
                      type="button"
                      className="stepper-btn stepper-btn--plus"
                      disabled={full}
                      onClick={() => add(m.id)}
                      aria-label={`${m.name} 한 스쿱 더 담기`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 오른쪽: 흙 봉투 · 스쿱 · 결과 (SoilMeter) */}
        <div className="soil-meter">
          <div className="soil-meter__bag-wrap">
            <div className="soil-meter__bag-box">
              <div role="img" aria-label={potLabel} className="soil-bag">
                <div aria-hidden="true" className="soil-bag__top" />
                <div aria-hidden="true" className="soil-bag__seam soil-bag__seam--top" />
                <div className="soil-bag__inner">
                  {seq.map((id, i) => (
                    <div key={`${id}-${i}`} className="soil-bag__layer" style={fillStyle(MATERIAL_BY_ID[id])} />
                  ))}
                </div>
                <div aria-hidden="true" className="soil-bag__bottom" />
                <div aria-hidden="true" className="soil-bag__seam soil-bag__seam--bottom" />
              </div>
              {/* 스쿱 눈금 */}
              <div aria-hidden="true" className="soil-meter__ticks">
                {TICKS.map((n) => (
                  <div key={n} className={`soil-meter__tick${n % 5 === 0 ? ' is-major' : ''}`}>
                    {n % 5 === 0 && <span>{n}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 스쿱 게이지 */}
          <div className="soil-meter__gauge">
            <div className="soil-meter__gauge-head">
              <div className="soil-meter__count">
                <span aria-live="polite" className="soil-meter__count-num">
                  {total}
                </span>
                <span className="soil-meter__count-max">/ {MAX_SCOOPS} 스쿱</span>
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--md soil-meter__reset"
                disabled={total === 0}
                onClick={() => setSeq([])}
              >
                다시 담기
              </button>
            </div>
            <div aria-hidden="true" className="soil-meter__slots">
              {TICKS.map((n, i) => (
                <span
                  key={n}
                  className="soil-meter__slot"
                  style={i < total ? fillStyle(MATERIAL_BY_ID[seq[i]]) : undefined}
                />
              ))}
            </div>
            <span className="soil-meter__liters">
              {(total * LITERS_PER_SCOOP).toFixed(1)}L / 6L
            </span>
          </div>

          {/* 결과 막대 */}
          <div className="soil-meter__bars">
            {mix.bars.map((b) => (
              <div key={b.label} className="soil-meter__bar-row">
                <span className="soil-meter__bar-label">{b.label}</span>
                <div className="soil-meter__bar-track">
                  <div
                    className="soil-meter__bar-fill"
                    style={{ width: `${Math.round(Math.min(1, b.value) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 결과 문구 */}
          <div className="soil-meter__result">
            <h2 aria-live="polite" className="display-3">
              {mix.title}
            </h2>
            {mix.desc && <p className="soil-meter__result-desc">{mix.desc}</p>}
          </div>

          {/* P3-B3: 장바구니 · 결제는 [미정] — 지금은 버튼까지만 */}
          <button type="button" className="btn btn--secondary btn--block" disabled={total === 0}>
            이 배합으로 구매
          </button>
        </div>
      </div>
    </section>
  )
}

export default SoilMixer
