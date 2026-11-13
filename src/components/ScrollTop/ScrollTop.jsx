import './ScrollTop.css'

// 푸터 위 '맨 위로' 버튼 — 부드럽게 맨 위로 이동
function ScrollTop() {
  const handleClick = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="scroll-top">
      <button type="button" className="scroll-top__btn" onClick={handleClick} aria-label="맨 위로">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </button>
    </div>
  )
}

export default ScrollTop
