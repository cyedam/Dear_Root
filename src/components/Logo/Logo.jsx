import { Link } from 'react-router-dom'
import logoSrc from '../../assets/logo/dear-root-logo.svg'
import { ROUTES } from '../../routes.js'
import './Logo.css'

function Logo() {
  return (
    <Link to={ROUTES.main} className="logo" aria-label="Dear Root 메인으로">
      <img src={logoSrc} alt="Dear Root" className="logo__img" />
    </Link>
  )
}

export default Logo
