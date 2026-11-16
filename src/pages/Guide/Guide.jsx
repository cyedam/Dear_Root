import { useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import { ROUTES } from '../../routes.js'
import { BUGS, CARE_TOPICS, FAQS } from './guideData.js'
import './Guide.css'

function Chevron({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`chevron${open ? ' is-open' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// P4-S2 ~ S4 한 칸: 일러스트 + 제목 + 공통 요령, 아래 '식물 종류별로 보기' (처음에는 접힘)
function CareTopic({ topic }) {
  const [open, setOpen] = useState(false)
  const panelId = `${topic.id}-types`

  return (
    <article id={topic.id} aria-label={topic.title} className="guide-topic">
      <div className="guide-topic__media">
        <img src={topic.image} alt="" />
      </div>
      <div className="guide-topic__body">
        <h2 className="display-2">{topic.title}</h2>
        <p className="guide-topic__text">{topic.text}</p>
      </div>
      <div className="guide-topic__more">
        <button
          type="button"
          className="toggle-btn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          식물 종류별로 보기
          <Chevron open={open} />
        </button>
        {open && (
          <ul id={panelId} className="type-grid fade-in">
            {topic.types.map((t) => (
              <li key={t.type} className="type-card">
                <h3>{t.type}</h3>
                <p>{t.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

// P4-S5 벌레 한 종 — 심할 때 · 예방은 펼쳐서 보기
function BugItem({ bug, order }) {
  const [open, setOpen] = useState(false)
  const panelId = `bug-${bug.name}`

  return (
    <li className="bug-item" style={{ order }}>
      <div className="bug-item__media">
        <img src={bug.image} alt="" />
      </div>
      <div className="bug-item__body">
        <div className="bug-item__title">
          <h3>{bug.name}</h3>
          {bug.helpful && <span className="badge badge--lime">익충</span>}
        </div>
        <span className="bug-item__look">{bug.look}</span>
        <p className="bug-item__action">{bug.action}</p>
        <button
          type="button"
          className="toggle-btn toggle-btn--sm"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          심할 때 · 예방
          <Chevron open={open} />
        </button>
        {open && (
          <dl id={panelId} className="bug-item__detail fade-in">
            <div>
              <dt>심할 때</dt>
              <dd>{bug.severe}</dd>
            </div>
            <div>
              <dt>예방</dt>
              <dd>{bug.prevent}</dd>
            </div>
          </dl>
        )}
      </div>
    </li>
  )
}

// P4-S6 자주 묻는 질문 — 처음에는 첫 번째 질문만 펼침
function Faq() {
  const [openIndex, setOpenIndex] = useState(0)
  const [question, setQuestion] = useState('')

  return (
    <section id="qna" aria-label="궁금한 점 Q&A" className="section section--tint guide-faq">
      <div className="guide-section-head">
        <h2 className="display-2">궁금한 점 Q&amp;A</h2>
        <p className="guide-section-head__sub">가이드를 읽어도 잘 모르겠다면 편하게 물어봐 주세요.</p>
      </div>
      <ul className="faq-list">
        {FAQS.map((f, i) => {
          const open = openIndex === i
          return (
            <li key={f.q} className={`faq-item${open ? ' is-open' : ''}`}>
              <button
                type="button"
                className="faq-item__q"
                aria-expanded={open}
                aria-controls={`faq-${i}`}
                onClick={() => setOpenIndex(open ? -1 : i)}
              >
                <span>Q. {f.q}</span>
                <Chevron open={open} />
              </button>
              {open && (
                <div id={`faq-${i}`} className="faq-item__a fade-in">
                  {f.answer ? (
                    <p>A. {f.answer}</p>
                  ) : (
                    <span className="placeholder-chip">답변 자리 [미정]</span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <form className="faq-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="faq-question" className="visually-hidden">
          궁금한 점
        </label>
        <textarea
          id="faq-question"
          className="faq-form__input"
          rows={5}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="궁금한 점을 적어 주세요. 어떤 식물인지, 언제부터 그랬는지 알려 주시면 더 정확하게 도와드릴 수 있어요."
        />
        {/* P4-B1: 답변 방식 [미정] — 지금은 버튼까지만 */}
        <Button variant="secondary" type="submit" className="faq-form__submit">
          질문 남기기
        </Button>
      </form>
    </section>
  )
}

function Guide() {
  return (
    <>
      {/* P4-S1 페이지 소개 + P4-S2 물 주기 · S3 햇빛 · S4 분갈이 (소개를 카드 위에 함께, 답변 2026-11-16) */}
      <section aria-label="케어 가이드 · 물 주기 · 햇빛 · 분갈이" className="section section--tint guide-topics-section">
        <div className="guide-section-head">
          <h1 className="display-2">케어 가이드</h1>
          <p className="guide-section-head__sub">처음 키우는 분도 따라 하기 쉽게, 꼭 필요한 것만 정리했어요.</p>
        </div>
        <div className="guide-topics">
          {CARE_TOPICS.map((topic) => (
            <CareTopic key={topic.id} topic={topic} />
          ))}
        </div>
      </section>

      {/* P4-S5 벌레 대처 */}
      <section id="bugs" aria-label="벌레 대처" className="section guide-bugs">
        <div className="guide-section-head">
          <h2 className="display-2">벌레 대처</h2>
          <p className="guide-section-head__sub">
            식물을 키우다 보면 벌레가 찾아오는 건 자연스러운 일이에요. 조금만 관리해 주면 더 건강하게 자랄 거예요.
          </p>
        </div>
        {/* 왼쪽 · 오른쪽 두 줄을 따로 쌓음 → 펼친 카드가 있는 줄만 내려감 (답변 2026-11-16). 한 줄 화면에서는 원래 순서대로 */}
        <div className="bug-cols">
          {[0, 1].map((col) => (
            <ul key={col} className="bug-list">
              {BUGS.map((bug, i) =>
                i % 2 === col ? <BugItem key={bug.name} bug={bug} order={i} /> : null,
              )}
            </ul>
          ))}
        </div>
      </section>

      {/* P4-S6 궁금한 점 Q&A */}
      <Faq />

      {/* P4-S7 체험 유도 */}
      <section aria-label="체험 유도" className="section section--fit">
        <div className="cta-row">
          <p className="cta-row__text">내 식물에 꼭 맞는 케어가 궁금하다면</p>
          <Button variant="primary" to={ROUTES.careTest} icon="right">
            맞춤 케어 체험 시작
          </Button>
        </div>
      </section>
    </>
  )
}

export default Guide
