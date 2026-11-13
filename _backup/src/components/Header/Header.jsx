import { Link, NavLink } from 'react-router-dom';
import mark from '../../assets/logo/dear-root-mark.svg';
import { ROUTES } from '../../routes.js';
import './Header.css';

const MENU = [
  { to: ROUTES.careTest, label: '맞춤 케어 체험' },
  { to: ROUTES.products, label: '케어 제품' },
  { to: ROUTES.guide, label: '케어 가이드' },
];

/** GNB. `overlay` = transparent, laid over the P1 hero scene. */
export default function Header({ overlay = false }) {
  return (
    <header className={`gnb${overlay ? ' gnb--overlay' : ''}`}>
      <Link to={ROUTES.main} className="gnb__logo" aria-label="Dear Root 메인으로">
        <img src={mark} alt="" width="34" height="34" />
        <span className="wordmark">Dear Root</span>
      </Link>
      <nav className="gnb__menu" aria-label="주 메뉴">
        {MENU.map((m) => (
          <NavLink key={m.to} to={m.to} className="gnb__link">
            {m.label}
          </NavLink>
        ))}
      </nav>
      <div className="gnb__right" aria-hidden="true" />
    </header>
  );
}
