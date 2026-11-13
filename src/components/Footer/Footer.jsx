import { Link } from 'react-router-dom'
import Logo from '../Logo/Logo.jsx'
import { NAV_ITEMS } from '../../routes.js'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo />
          <p className="footer__desc">잎이 보내는 신호를 읽고 뿌리부터 다시 돌보는 맞춤 케어, Dear Root 입니다.</p>
        </div>
        <nav aria-label="푸터 메뉴" className="footer__menu">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="footer__link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="footer__bottom">
        <span className="footer__placeholder">회사 정보 · 고객 문의 자리 [미정]</span>
        <span className="footer__copy">© Dear Root</span>
      </div>
    </footer>
  )
}

export default Footer
