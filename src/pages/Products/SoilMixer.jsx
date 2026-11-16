import { useEffect, useRef, useState } from 'react'
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

// 이 폭 이하에서는 재료 목록이 화면 아래 바텀시트로 바뀜 (SoilMixer.css와 같은 값)
const SHEET_QUERY = '(max-width: 1100px)'

function SoilMixer() {
  // 담은 순서대로 쌓임 (한 칸 = 1스쿱). 처음에는 비어 있음
  const [seq, setSeq] = useState([])
  const total = seq.length
  const full = total >= MAX_SCOOPS
  const cnt = countBy(seq)
  const mix = evaluateMix(seq)

  // 바텀시트 (좁은 화면)
  const sectionRef = useRef(null)
  const meterRef = useRef(null)
  const headRef = useRef(null)
  // 자동 맞춤은 처음 담을 때 한 번만
  const alignedRef = useRef(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [sheetVisible, setSheetVisible] = useState(false)

  // DIY 섹션이 화면에 있을 때만 바텀시트를 보여 줌 (세트 · 개별 상품을 가리지 않게)
  useEffect(() => {
    const update = () => {
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      setSheetVisible(r.top < vh * 0.7 && r.bottom > vh * 0.6)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // 바텀시트에서 처음 재료를 담을 때 '나만의 흙 만들기' 제목부터 흙 봉투 · 결과까지 시트 위에 보이도록 한 번 맞춤
  // (이후에는 사용자가 스크롤한 위치를 그대로 둠)
  const showMeter = () => {
    if (alignedRef.current) return
    if (!window.matchMedia(SHEET_QUERY).matches || !headRef.current) return
    alignedRef.current = true
    // 화면 위에 고정된 GNB 바로 아래로 맞춤
    const gnb = document.querySelector('.gnb')
    const offset = (gnb ? gnb.getBoundingClientRect().bottom : 0) + 12
    const top = headRef.current.getBoundingClientRect().top
    if (Math.abs(top - offset) > 24) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollBy({ top: top - offset, behavior: reduce ? 'auto' : 'smooth' })
    }
  }

  const add = (id) => {
    if (seq.length >= MAX_SCOOPS) return
    setSeq([...seq, id])
    showMeter()
  }
  const minus = (id) => {
    const i = seq.lastIndexOf(id)
    if (i < 0) return
    const next = [...seq]
    next.splice(i, 1)
    setSeq(next)
    showMeter()
  }

  const potLabel = total
    ? `흙 봉투에 담은 재료: ${MATERIALS.filter((m) => cnt[m.id] > 0)
        .map((m) => `${m.name} ${cnt[m.id]}스쿱`)
        .join(', ')}`
    : '흙 봉투가 비어 있어요'

  return (
    <section
      ref={sectionRef}
      id="diy"
      aria-label="나만의 흙 만들기"
      className={`section diy${sheetOpen ? '' : ' is-sheet-closed'}`}
    >
      <div ref={headRef} className="diy__head">
        <h1 className="display-1">나만의 흙 만들기</h1>
        <p className="diy__sub">재료를 한 스쿱씩 담아 보세요. 담을 때마다 이 흙이 어떤 식물에 잘 맞는지 바로 알려 드려요.</p>
      </div>

      <div className="diy__layout">
        {/* 왼쪽: 재료 카드 (MaterialCard). 좁은 화면에서는 화면 아래 바텀시트 */}
        <div
          className={`diy__materials${sheetOpen ? ' is-open' : ''}${sheetVisible ? ' is-visible' : ''}`}
        >
          {/* 바텀시트 손잡이 — 넓은 화면에서는 숨김 */}
          <button
            type="button"
            className="diy__sheet-handle"
            aria-expanded={sheetOpen}
            aria-controls="diy-material-list"
            onClick={() => setSheetOpen((o) => !o)}
          >
            <span aria-hidden="true" className="diy__sheet-grabber" />
            <span className="diy__sheet-head">
              <span className="diy__sheet-title">재료 고르기</span>
              <span className={`diy__sheet-count${total ? ' is-on' : ''}`}>
                {total} / {MAX_SCOOPS} 스쿱
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="diy__sheet-chevron"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
            <span className="visually-hidden">{sheetOpen ? '재료 목록 접기' : '재료 목록 펼치기'}</span>
          </button>
          <div className="diy__label-row">
            <span className="diy__label">재료 고르기 · 한 봉 6L, 1스쿱 0.6L</span>
          </div>
          <div id="diy-material-list" className="material-grid">
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
        <div ref={meterRef} className="soil-meter">
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
          <button type="button" className="btn btn--primary btn--block" disabled={total === 0}>
            이 배합으로 구매
          </button>
        </div>
      </div>
    </section>
  )
}

export default SoilMixer
