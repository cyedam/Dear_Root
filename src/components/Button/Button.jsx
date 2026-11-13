import { Link } from 'react-router-dom'
import './Button.css'

function Arrow({ direction = 'right', size = 18 }) {
  const d = direction === 'left' ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="btn__icon"
    >
      <path d={d} />
    </svg>
  )
}

/**
 * 버튼 위계 (디자인 시스템 Button)
 * - primary: 꽉 찬 리프 그린. '맞춤 케어 체험 시작' · '다음'에만
 * - secondary: 흰 바탕 + 리프 그린 테두리. 구매 · 이동 · 이전
 * - scene: 사진(장면) 위 버튼
 * size: lg(56px, 폭 260) / md(48px) / block(가로 꽉 채움, 56px)
 */
function Button({
  variant = 'secondary',
  size = 'lg',
  to,
  href,
  icon,
  iconPosition = 'end',
  className = '',
  children,
  ...rest
}) {
  const classes = `btn btn--${variant} btn--${size} ${className}`.trim()
  const arrowSize = variant === 'primary' ? 20 : 18
  const content = (
    <>
      {icon && iconPosition === 'start' && <Arrow direction={icon} size={arrowSize} />}
      {children}
      {icon && iconPosition === 'end' && <Arrow direction={icon} size={arrowSize} />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  )
}

export default Button
