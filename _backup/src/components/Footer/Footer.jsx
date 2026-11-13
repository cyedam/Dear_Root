import { Link } from 'react-router-dom';
import mark from '../../assets/logo/dear-root-mark.svg';
import { ROUTES } from '../../routes.js';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div>
          <Link to={ROUTES.main} className="footer__logo">
            <img src={mark} alt="" width="34" height="34" />
            <span className="wordmark">Dear Root</span>
          </Link>
          <p className="footer__desc">잎이 보내는 신호를 읽고 뿌리부터 다시 돌보는 맞춤 케어, Dear Root 입니다.</p>
        </div>
        <nav className="footer__menu" aria-label="하단 메뉴">
          <Link to={ROUTES.careTest}>맞춤 케어 체험</Link>
          <Link to={ROUTES.products}>케어 제품</Link>
          <Link to={ROUTES.guide}>케어 가이드</Link>
        </nav>
      </div>
      <div className="footer__bottom">
        <span className="footer__todo">회사 정보 · 고객 문의 자리 [미정]</span>
        <span>© Dear Root</span>
      </div>
    </footer>
  );
}
