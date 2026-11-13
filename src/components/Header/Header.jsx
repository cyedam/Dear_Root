import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Logo from '../Logo/Logo.jsx'
import { NAV_ITEMS, ROUTES } from '../../routes.js'
import './Header.css'

// GNB-01 ~ GNB-04. 장바구니(GNB-05)는 [미정]이라 오른쪽 영역만 비워 둠
// overlay(메인): 화면 위에 고정. 히어로 장면 위에서는 투명, 히어로를 지나면 흰 바탕
function Header({ overlay = false }) {
  const { pathname } = useLocation()
  const isMain = pathname === ROUTES.main
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    if (!overlay) return undefined
    const onScroll = () => {
      // 히어로 장면이 GNB 아래로 다 지나가면 흰 바탕으로
      const hero = document.querySelector('.hero-track')
      setSolid(hero ? hero.getBoundingClientRect().bottom < 80 : window.scrollY > 80)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [overlay])

  const cls = ['gnb', overlay && 'gnb--overlay', overlay && solid && 'gnb--solid'].filter(Boolean).join(' ')

  return (
    <header className={cls}>
      <nav aria-label="주 메뉴" className="gnb__inner">
        <div className="gnb__logo">
          <Logo />
        </div>
        <div className="gnb__menu">
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
        <div aria-hidden="true" />
      </nav>
    </header>
  )
}

export default Header
