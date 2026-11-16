import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../components/Button/Button.jsx'
import { ROUTES } from '../../routes.js'
import { NUTRIENTS, SETS, SOILS, formatPrice } from '../../data/products.js'
import SoilMixer from './SoilMixer.jsx'
import './Products.css'

// 케어 제품 하위 메뉴 (GNB 아래, 답변 2026-11-16)
const SUBNAV = [
  { id: 'diy', label: '나만의 흙 만들기' },
  { id: 'sets', label: '세트 상품' },
  { id: 'items', label: '개별 상품' },
]

const TABS = [
  { id: 'soil', label: '흙 6종', items: SOILS },
  { id: 'nutri', label: '영양제 4종', items: NUTRIENTS },
]

function Products() {
  // 체험 결과 카드에서 #items-soil · #items-nutri로 오면 그 탭으로 열림
  const { hash } = useLocation()
  const [tab, setTab] = useState(hash === '#items-nutri' ? 'nutri' : 'soil')
  const items = TABS.find((t) => t.id === tab).items
  const [current, setCurrent] = useState('diy')

  const target = (id) => document.querySelector(id === 'items' ? '[data-sub="items"]' : `#${id}`)

  // 지금 보고 있는 섹션을 하위 메뉴에 표시
  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.35
      let now = 'diy'
      SUBNAV.forEach(({ id }) => {
        const el = target(id)
        if (el && el.getBoundingClientRect().top <= line) now = id
      })
      setCurrent(now)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const go = (id) => {
    const el = target(id)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <>
      {/* 하위 메뉴: GNB 아래 고정, 누르면 해당 섹션으로 이동 */}
      <nav aria-label="케어 제품 메뉴" className="subnav">
        {SUBNAV.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`subnav__link${current === id ? ' is-active' : ''}`}
            aria-current={current === id ? 'true' : undefined}
            onClick={() => go(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* P3-S1 DIY 흙 만들기 */}
      <SoilMixer />

      {/* P3-S2 세트 상품 */}
      <section id="sets" aria-label="세트 상품" className="section section--tint products-section">
        <div className="products-section__head">
          <h2 className="display-2">세트 상품</h2>
          <p className="products-section__sub">자주 찾는 고민별로 흙과 영양제를 함께 담았어요.</p>
        </div>
        <div className="set-grid">
          {SETS.map((p) => (
            <div key={p.name} className="product-card product-card--set card-hover">
              <div className="product-card__media product-card__media--set">
                <img src={p.image} alt="" />
              </div>
              <h3 className="product-card__name">{p.name}</h3>
              <p className="product-card__desc product-card__desc--lg">{p.desc}</p>
              <span className="price">{formatPrice(p.price)}</span>
              {/* 장바구니 · 결제는 [미정] — 지금은 버튼까지만 */}
              <button type="button" className="btn btn--secondary btn--md product-card__buy">
                세트 구매
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* P3-S3 개별 상품 */}
      <section id={`items-${tab}`} data-sub="items" aria-label="개별 상품" className="section products-section products-section--single">
        <h2 className="display-2">개별 상품</h2>
        <div role="tablist" aria-label="상품 종류" className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tabs__tab${tab === t.id ? ' is-selected' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="item-grid">
          {items.map((p) => (
            <div key={p.name} className="product-card product-card--item card-hover">
              <div className={`product-card__media product-card__media--item${tab === 'soil' ? ' is-soil' : ''}`}>
                <img src={p.image} alt="" />
              </div>
              <h3 className="product-card__name product-card__name--sm">{p.name}</h3>
              {p.desc && <p className="product-card__desc">{p.desc}</p>}
              <span className="price">{formatPrice(p.price)}</span>
              <button type="button" className="btn btn--secondary btn--md product-card__buy product-card__buy--bottom">
                구매
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* P3-S4 체험 유도 */}
      <section aria-label="체험 유도" className="section section--fit section--tint">
        <div className="cta-row">
          <p className="cta-row__text">어떤 흙이 맞는지 잘 모르겠다면, 몇 가지 질문으로 같이 찾아봐요.</p>
          <Button variant="primary" to={ROUTES.careTest} icon="right">
            맞춤 케어 체험 시작
          </Button>
        </div>
      </section>
    </>
  )
}

export default Products
