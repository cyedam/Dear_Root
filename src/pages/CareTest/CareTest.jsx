import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import { ROUTES } from '../../routes.js'
import { formatPrice } from '../../data/products.js'
import { INITIAL_ANSWERS, STEP_NAMES, TOTAL, getQuestions, getResult } from './quizData.js'
import './CareTest.css'

function CareTest() {
  const [qi, setQi] = useState(0)
  const [view, setView] = useState('quiz')
  const [ans, setAns] = useState(INITIAL_ANSWERS)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // 질문이 바뀌거나 결과로 넘어가면 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [qi, view])

  const questions = getQuestions(ans)
  const q = questions[qi]
  const value = ans[q.id]

  const advance = () => {
    if (qi < TOTAL - 1) setQi(qi + 1)
    else setView('result')
  }

  const pick = (op, on) => {
    if (q.multi) {
      let cur = [...value]
      if (op.v === q.none) cur = on ? [] : [op.v]
      else {
        cur = cur.filter((x) => x !== q.none)
        cur = on ? cur.filter((x) => x !== op.v) : [...cur, op.v]
      }
      setAns({ ...ans, [q.id]: cur })
      return
    }
    const next = { ...ans, [q.id]: op.v }
    // 꽃 · 과실 식물이 아니면 '꽃봉오리 떨어짐' 증상은 지움
    if (q.id === 'type' && op.v !== 'flower' && op.v !== 'fruit') {
      next.symptom = ans.symptom.filter((x) => x !== 'budDrop')
    }
    setAns(next)
    // 단일 · 다중 선택 모두 '다음'을 눌러야 넘어감
  }

  const prev = () => {
    clearTimeout(timerRef.current)
    setQi((i) => Math.max(0, i - 1))
  }

  // 결과 화면에서 '다시 하기' — 답을 모두 지우고 첫 질문으로
  const restart = () => {
    clearTimeout(timerRef.current)
    setAns(INITIAL_ANSWERS)
    setQi(0)
    setView('quiz')
  }

  if (view === 'result') {
    return <Result ans={ans} onRestart={restart} />
  }

  // 답을 하나도 고르지 않으면 '다음' 비활성
  const nextDisabled = q.multi ? value.length === 0 : value == null

  return (
    <section
      id="test"
      aria-label="맞춤 케어 체험 질문"
      className={`section quiz${q.opts.length > 8 ? ' quiz--dense' : ''}`}
      // 데스크탑 열 수: 4장 이하는 장 수만큼, 8장 이하는 4열, 그보다 많으면 5열
      style={{ '--cols': q.opts.length <= 4 ? q.opts.length : q.opts.length <= 8 ? 4 : 5 }}
    >
      {/* P2-S1 진행 표시 */}
      <div className="quiz-progress">
        <div className="quiz-progress__head">
          <ol className="quiz-progress__steps">
            {STEP_NAMES.map((label, i) => {
              const n = i + 1
              const state = n === q.step ? 'current' : n < q.step ? 'done' : 'todo'
              return (
                <li key={label} className={`quiz-progress__step is-${state}`}>
                  <span className="quiz-progress__dot">{state === 'done' ? '✓' : n}</span>
                  {label}
                </li>
              )
            })}
          </ol>
          <span aria-live="polite" className="quiz-progress__count">
            {qi + 1} / {TOTAL}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="진행"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={qi + 1}
          className="quiz-progress__track"
        >
          <div className="quiz-progress__bar" style={{ width: `${((qi + 1) / TOTAL) * 100}%` }} />
        </div>
      </div>

      {/* P2-S2 질문 카드 */}
      <div key={q.id} className="quiz-question fade-in">
        <div className="quiz-question__head">
          <h1 className="display-1">{q.title}</h1>
          {q.sub && <p className="quiz-question__sub">{q.sub}</p>}
          {q.season && <span className="badge badge--lime badge--lg">{q.season}</span>}
        </div>
        <div
          role={q.multi ? 'group' : 'radiogroup'}
          aria-label={q.title}
          className={`choice-grid${q.opts.length > 8 ? ' choice-grid--dense' : ''}`}
        >
          {q.opts.map((op) => {
            const on = q.multi ? value.includes(op.v) : value === op.v
            return (
              <button
                key={op.v}
                type="button"
                role={q.multi ? 'checkbox' : 'radio'}
                aria-checked={on}
                className={`choice-card card-hover${on ? ' is-selected' : ''}`}
                onClick={() => pick(op, on)}
              >
                <span className="choice-card__media">
                  <img src={op.image} alt="" />
                </span>
                <span className="choice-card__name">{op.name}</span>
                {op.desc && <span className="choice-card__desc">{op.desc}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* P2-S3 질문 이동 */}
      {/* 화면 양옆에 고정: 왼쪽 이전 질문 · 오른쪽 다음 (모든 질문) */}
      <nav aria-label="질문 이동" className="quiz-nav">
        <button
          type="button"
          className="quiz-nav__btn quiz-nav__btn--prev"
          disabled={qi === 0}
          onClick={prev}
        >
          <span className="quiz-nav__circle">
            <NavArrow direction="left" />
          </span>
          <span className="quiz-nav__label">이전 질문</span>
        </button>
        <button
          type="button"
          className="quiz-nav__btn quiz-nav__btn--next"
          disabled={nextDisabled}
          onClick={() => !nextDisabled && advance()}
        >
          <span className="quiz-nav__circle">
            <NavArrow direction="right" />
          </span>
          <span className="quiz-nav__label">다음</span>
        </button>
      </nav>
    </section>
  )
}

function NavArrow({ direction }) {
  const d = direction === 'left' ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

function Result({ ans, onRestart }) {
  const r = getResult(ans)

  return (
    <>
      {/* P2-S4 결과 요약 */}
      <section aria-label="진단 결과" className="section section--tint">
        {/* 다시 하기 — 결과 화면 왼쪽 위 */}
        <Button
          variant="secondary"
          size="md"
          icon="left"
          iconPosition="start"
          className="result-restart"
          onClick={onRestart}
        >
          다시 하기
        </Button>
        <div className="result-summary">
          <div className="result-summary__media fade-in fade-in-1">
            {r.primary.image && <img src={r.primary.image} alt="" />}
          </div>
          <div className="result-summary__body fade-in fade-in-2">
            <div className="result-summary__head">
              <span className="badge badge--lime badge--lg">진단 결과</span>
              <h2 className="display-1">{r.primary.title}</h2>
              {r.primary.desc && <p className="result-summary__desc">{r.primary.desc}</p>}
            </div>
            {r.primary.action && (
              <div className="result-summary__action">
                <h3>가장 먼저 할 일</h3>
                <p>{r.primary.action}</p>
              </div>
            )}
            {r.primary.showEmphasis && (
              <p className="result-summary__emphasis">조금만 바꿔 주면 다시 건강하게 자랄 거예요.</p>
            )}
            {ans.type === 'unknown' && <p className="result-summary__note">종류를 알면 더 정확해요.</p>}
          </div>
        </div>
      </section>

      {/* P2-S5 다른 원인 · 벌레 대처 */}
      {r.others.length > 0 && (
        <section aria-label="함께 살펴보면 좋아요" className="section result-others fade-in fade-in-3">
          <h2 className="display-2">함께 살펴보면 좋아요</h2>
          <div className="result-others__list">
            {r.others.map((o) => (
              <div key={o.title} className="cause-item">
                <div className="cause-item__media">{o.image && <img src={o.image} alt="" />}</div>
                <div className="cause-item__body">
                  <h3>{o.title}</h3>
                  {o.desc && <p>{o.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* P2-S6 추천 케어 (상품이 필요 없는 원인이면 숨김) */}
      {r.products.length > 0 && (
        <section aria-label="추천 케어" className="section section--tint result-products fade-in fade-in-4">
          <h2 className="display-2">내 식물을 위한 추천 케어</h2>
          <div className="result-products__grid">
            {r.products.map((p) => (
              <Link
                key={p.name}
                to={`${ROUTES.products}#items-${p.kind === '흙' ? 'soil' : 'nutri'}`}
                className="rec-card card-hover"
                aria-label={`${p.name} 케어 제품에서 보기`}
              >
                {/* 오른쪽 위 화살표: 카드를 누르면 케어 제품의 개별 상품(같은 탭)으로 이동 */}
                <svg className="rec-card__arrow" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <div className="rec-card__media">
                  <img src={p.image} alt="" />
                </div>
                <div className="rec-card__body">
                  <span className={`badge ${p.kind === '흙' ? 'badge--sand' : 'badge--lime'}`}>{p.kind}</span>
                  <h3>{p.name}</h3>
                  {p.desc && <p>{p.desc}</p>}
                  <span className="price">{formatPrice(p.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* P2-S7 다음 행동 */}
      <section aria-label="다음 행동" className="section">
        <div className="cta-row">
          <p className="cta-row__text">물 주기와 분갈이 방법을 더 자세히 알고 싶다면</p>
          <Button variant="primary" to={ROUTES.guide} icon="right">
            케어 가이드 보기
          </Button>
        </div>
      </section>
    </>
  )
}

export default CareTest
