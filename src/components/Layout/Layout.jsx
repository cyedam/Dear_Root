import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../Header/Header.jsx'
import Footer from '../Footer/Footer.jsx'
import ScrollTop from '../ScrollTop/ScrollTop.jsx'
import { ROUTES } from '../../routes.js'

// 페이지가 바뀌면 맨 위로, #해시가 있으면 그 섹션으로 이동
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    // 화면이 그려진 다음에 이동해야 위치가 맞음
    const go = () => {
      const el = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
      if (el) el.scrollIntoView({ behavior: 'instant' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const first = setTimeout(go, 0)
    // 주소에 #이 붙은 채로 처음 열면 글꼴 · 이미지가 자리 잡은 뒤 한 번 더 맞춤
    const retry = hash ? setTimeout(go, 400) : null
    return () => {
      clearTimeout(first)
      clearTimeout(retry)
    }
  }, [pathname, hash])
}

function Layout() {
  const { pathname } = useLocation()
  useScrollOnNavigate()

  // P1 메인에서는 GNB가 투명 배경으로 히어로 위에 겹침
  const isMain = pathname === ROUTES.main

  return (
    <>
      <Header overlay={isMain} />
      <main>
        <Outlet />
      </main>
      <ScrollTop />
      <Footer />
    </>
  )
}

export default Layout
