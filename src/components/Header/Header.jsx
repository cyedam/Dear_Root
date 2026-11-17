import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Logo from '../Logo/Logo.jsx'
import { NAV_ITEMS, ROUTES } from '../../routes.js'
import './Header.css'

// GNB-01 ~ GNB-05. 장바구니(GNB-05)는 오른쪽 위 아이콘만 둠 — 장바구니 · 결제 화면은 만들지 않아 누르면 동작 없음 (답변 2026-11-17)
// overlay(메인): 화면 위에 고정. 히어로 장면 위에서는 투명, 히어로를 지나면 흰 바탕
function Header({ overlay = false }) {
  const { pathname } = useLocation()
  const isMain = pathname === ROUTES.main
  const [solid, setSolid] = useState(false)
  // 히어로 장면이 끝나 위로 밀려 올라가기 시작하면 GNB 뒤를 흐리게 (글자가 겹쳐 보이지 않게, 답변 2026-11-16)
  const [blur, setBlur] = useState(false)
  // 모바일(768px 이하) 메뉴 펼침
  const [menuOpen, setMenuOpen] = useState(false)

  // 페이지를 옮기면 메뉴를 닫음
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Esc로 닫기
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    if (!overlay) return undefined
    const onScroll = () => {
      // 히어로 장면이 GNB 아래로 다 지나가면 흰 바탕으로
      const hero = document.querySelector('.hero-track')
      const bottom = hero ? hero.getBoundingClientRect().bottom : 0
      setSolid(hero ? bottom < 80 : window.scrollY > 80)
      setBlur(!!hero && bottom < window.innerHeight - 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [overlay])

  const cls = ['gnb', overlay && 'gnb--overlay', overlay && solid && 'gnb--solid', overlay && blur && 'gnb--blur', menuOpen && 'is-menu-open']
    .filter(Boolean)
    .join(' ')

  return (
    <header className={cls}>
      <nav aria-label="주 메뉴" className="gnb__inner">
        <div className="gnb__logo">
          <Logo />
        </div>
        <div id="gnb-menu" className="gnb__menu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                // 메인에서는 핵심 행동인 '맞춤 케어 체험'을 강조 (디자인 시안 기준)
                const highlight = isActive || (isMain && item.to === ROUTES.careTest)
                return `gnb__link${highlight ? ' is-active' : ''}`
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="gnb__end">
          {/* GNB-05 장바구니 아이콘 (아이콘만, 동작 없음) */}
          <button type="button" className="gnb__cart" aria-label="장바구니">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14l-1.3 11.1a1 1 0 0 1-1 .9H7.3a1 1 0 0 1-1-.9L5 8z" />
              <path d="M9 10V7a3 3 0 0 1 6 0v3" />
            </svg>
          </button>
          {/* 모바일 메뉴 버튼 — 데스크탑에서는 숨김 */}
          <button
            type="button"
            className="gnb__burger"
            aria-expanded={menuOpen}
            aria-controls="gnb-menu"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Header
