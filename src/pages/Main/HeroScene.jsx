import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import SideRays from '../../components/SideRays/SideRays.jsx'
import { ROUTES } from '../../routes.js'
import { SOIL, SUN } from './heroConfig.js'
import soil from '../../assets/P1_hero/soil.webp'
import { buildField, drawBackdrop, drawField, loadBitmaps } from './heroField.js'
import { createRenderer } from './heroGL.js'
import './HeroScene.css'

/*
 * P1 메인 — 히어로 → 장면 ① 흙 → 장면 ② 햇빛을 끊김 없는 한 장면으로 (참고: 히어로 인터랙션 시연 아티팩트)
 * - 바람: 마우스가 지나간 자리에 바람이 남고(0.6~1초 동안 옅어짐), 식물은 잎 끝에 닿은 바람만큼 밑동을 축으로 휘었다가 스프링처럼 돌아옴
 * - 겹: 뒤(약하게 · 느리게) · 중간 · 앞(세게 · 빠르게)
 * - 스크롤: 화면을 3장 높이로 고정해 두고 문구가 차례로 바뀜. 배경은 ①에서 위로, ②에서 아래로 26px
 * - ② 햇빛: 따뜻한 배경 + 흰 큰 빛(밝게 더하기) + SideRays 금빛 빛줄기(밝은 배경 모드)
 * - 크기 · 개수 · 색 등 숫자는 heroConfig.js에서 조절
 */

const SHIFT = 26 // 배경 이동(px)
const GX = 64
const GY = 40

const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))

function HeroScene() {
  const trackRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const backdropRef = useRef(null)
  const soilRef = useRef(null)
  const sunTintRef = useRef(null)
  const raysRef = useRef(null)
  const glowRef = useRef(null)
  const copyRefs = useRef([])
  // 햇빛 장면에 들어올 때마다 빛이 새로 퍼지도록 SideRays를 다시 그림
  const [raysKey, setRaysKey] = useState(0)
  const [showRays, setShowRays] = useState(false)
  // 터치 기기(휴대폰 · 태블릿): 빛줄기는 멈춘 그림으로 (배터리 · 발열 줄임)
  const [isTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  // 마우스 · 트랙패드가 하나라도 연결돼 있으면 마우스 효과를 켬 (태블릿 + 트랙패드 포함)
  const [hasMouse] = useState(() => window.matchMedia('(any-pointer: fine)').matches)

  // 월페이퍼 모드 — 글씨 · 메뉴를 모두 숨기고 움직이는 배경만 남김 (답변 2026-11-16)
  const [wall, setWall] = useState(false)
  // 몬스테라 커서 켜기 · 끄기 (index.html의 PuffyCursor). 커서가 켜질 수 있는 기기(PC)에서만 버튼을 보여 줌
  const [cursorReady] = useState(() => !!window.__puffyCursorReady)
  const [cursorOn, setCursorOn] = useState(() => !!window.PuffyCursor?.isEnabled())
  const toggleCursor = () => {
    if (!window.PuffyCursor) return
    setCursorOn(window.PuffyCursor.setEnabled(!window.PuffyCursor.isEnabled()))
  }
  // 월페이퍼 모드에서 천천히 떠오르는 빛 알갱이 (위치 · 크기 · 빠르기는 처음 한 번만 정함)
  const [motes] = useState(() =>
    Array.from({ length: 18 }, () => ({
      left: `${(Math.random() * 100).toFixed(1)}%`,
      size: `${(4 + Math.random() * 7).toFixed(1)}px`,
      dur: `${(14 + Math.random() * 12).toFixed(1)}s`,
      delay: `${(-Math.random() * 26).toFixed(1)}s`,
      drift: `${((Math.random() - 0.5) * 120).toFixed(0)}px`,
    })),
  )
  useEffect(() => {
    document.body.classList.toggle('hero-wall', wall)
    // 월페이퍼 동안은 스크롤을 멈춰 지금 장면을 그대로 둠
    document.documentElement.style.overflow = wall ? 'hidden' : ''
    if (!wall) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setWall(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('hero-wall')
      document.documentElement.style.overflow = ''
    }
  }, [wall])

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    const hasFine = window.matchMedia('(any-pointer: fine)').matches
    // 장면 하나당 스크롤 길이 — 터치 기기는 화면 높이의 절반으로 짧게 (HeroScene.css의 .hero-track 높이와 맞춤)
    const STEP = touch ? 0.5 : 1

    const windX = new Float32Array(GX * GY)
    const windY = new Float32Array(GX * GY)
    const canvas = canvasRef.current
    let bitmaps = {}
    let plants = []
    let disposed = false
    // WebGL2가 되면 겹 깊이 · 색 변화를 셰이더로, 안 되면 2D로 그림
    let renderer = null
    let ctx2d = null

    let W = 1
    let H = 1
    let lastOff = 0
    let lastSun = 0
    let lastTime = 0
    const draw = (off) => {
      if (renderer) renderer.draw(plants, off, lastSun, lastTime)
      else if (ctx2d) {
        ctx2d.clearRect(0, 0, W, H)
        drawField(ctx2d, plants, bitmaps, off)
      }
    }
    const measure = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      W = stage.clientWidth
      H = stage.clientHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
      plants = buildField(W, H, bitmaps)
      if (backdropRef.current) drawBackdrop(backdropRef.current, W, H, bitmaps)
      draw(lastOff)
    }
    const ro = new ResizeObserver(measure)
    loadBitmaps().then((b) => {
      if (disposed) return
      bitmaps = b
      renderer = createRenderer(canvas, bitmaps)
      if (!renderer) ctx2d = canvas.getContext('2d')
      ro.observe(stage)
      measure()
    })

    // 마우스를 따라가는 두 점(p0 → p1). 두 점 사이를 따라 바람을 칠함
    const mouse = { x: -9999, y: -9999, in: false }
    const p0 = { x: 0, y: 0 }
    const p1 = { x: 0, y: 0 }
    const v1 = { x: 0, y: 0 }
    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      const r = stage.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (!mouse.in) {
        p0.x = p1.x = x
        p0.y = p1.y = y
      }
      mouse.x = x
      mouse.y = y
      mouse.in = true
    }
    const onLeave = () => {
      mouse.in = false
    }
    // 마우스 전용 — 마우스 · 트랙패드가 없으면 마우스 위치를 듣지 않음 (바람 효과 없음)
    if (hasFine) {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
    }

    const paintWind = (amount) => {
      p0.x += (mouse.x - p0.x) * 0.12
      p0.y += (mouse.y - p0.y) * 0.12
      v1.x += (p0.x - p1.x - v1.x) * 0.2
      v1.y += (p0.y - p1.y - v1.y) * 0.2
      p1.x += v1.x * 0.25
      p1.y += v1.y * 0.25
      const dx = p0.x - p1.x
      const dy = p0.y - p1.y
      const len = Math.hypot(dx, dy)
      if (mouse.in && len > 0.5 && amount > 0.01) {
        const steps = Math.min(24, Math.ceil(len / 12))
        const gr = Math.max(1.5, ((0.08 * W) / W) * GX)
        const fx = dx / len
        const fy = dy / len
        const speed = Math.min(1, len / 90)
        for (let s = 0; s <= steps; s++) {
          const t = s / steps
          const px = ((p1.x + dx * t) / W) * GX
          const py = ((p1.y + dy * t) / H) * GY
          const x0 = Math.max(0, Math.floor(px - gr * 2))
          const x1 = Math.min(GX - 1, Math.ceil(px + gr * 2))
          const y0 = Math.max(0, Math.floor(py - gr * 2))
          const y1 = Math.min(GY - 1, Math.ceil(py + gr * 2))
          for (let gy = y0; gy <= y1; gy++) {
            for (let gx = x0; gx <= x1; gx++) {
              const d2 = ((gx - px) ** 2 + (gy - py) ** 2) / (gr * gr)
              const w = ((Math.exp(-d2) * speed * 0.35 * amount) / steps) * 6
              const i = gy * GX + gx
              windX[i] += fx * w
              windY[i] += fy * w
            }
          }
        }
      }
      // 바람 자국이 옅어짐
      const keep = Math.pow(0.5, 1 / 60 / 0.28)
      for (let i = 0; i < windX.length; i++) {
        windX[i] = Math.max(-1.6, Math.min(1.6, windX[i] * keep))
        windY[i] *= keep
      }
    }
    const sample = (x, y) => {
      const gx = Math.max(0, Math.min(GX - 1, Math.round((x / W) * GX)))
      const gy = Math.max(0, Math.min(GY - 1, Math.round((y / H) * GY)))
      return windX[gy * GX + gx]
    }

    // 스크롤 → 장면 진행도 (0 히어로 · 1 흙 · 2 햇빛)
    let prog = 0
    let progS = 0
    const readScroll = () => {
      const top = track.getBoundingClientRect().top
      prog = Math.max(0, Math.min(2, -top / (window.innerHeight * STEP)))
    }
    readScroll()
    progS = prog

    // 휠을 멈추면 가던 방향의 장면까지 부드럽게 마저 이동
    let snapTimer = 0
    let snapping = false
    let lastY = window.scrollY
    let dir = 0
    const onScroll = () => {
      readScroll()
      const y = window.scrollY
      if (y !== lastY) dir = Math.sign(y - lastY)
      lastY = y
      // 터치 기기에서는 장면 자동 맞춤을 하지 않음 — 손을 뗀 뒤 이어지는 관성 스크롤과 부딪힘
      if (touch) return
      clearTimeout(snapTimer)
      if (snapping) return
      snapTimer = setTimeout(() => {
        const vh = window.innerHeight
        const trackTop = track.offsetTop
        const pos = (window.scrollY - trackTop) / vh
        if (pos < 0 || pos > 2.02) return
        const base = Math.floor(pos)
        const frac = pos - base
        if (frac < 0.02 || frac > 0.98) return
        let target
        if (dir > 0) target = frac > 0.12 ? base + 1 : base
        else target = frac < 0.88 ? base : base + 1
        target = trackTop + Math.max(0, Math.min(2, target)) * vh
        snapping = true
        window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' })
        setTimeout(() => {
          snapping = false
        }, 700)
      }, 220)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let inSun = false
    let raf = 0
    let lastDraw = 0
    const t0 = performance.now()
    const frame = (now) => {
      // 터치 기기: 스크롤이 멈춰 있을 때는 초당 20번만 그림 (배터리 · 발열 줄임)
      if (touch && Math.abs(prog - progS) < 0.0005 && now - lastDraw < 50) {
        raf = requestAnimationFrame(frame)
        return
      }
      lastDraw = now
      const time = (now - t0) / 1000
      progS += (prog - progS) * (reduce ? 1 : 0.12)
      const s1 = ease(progS)
      const s2 = ease(progS - 1)

      if (!inSun && progS > 1.5) {
        inSun = true
        setShowRays(true)
        setRaysKey((k) => k + 1)
      } else if (inSun && progS < 1.3) {
        inSun = false
        setShowRays(false)
      }

      const off = -SHIFT * s1 + 2 * SHIFT * s2
      const windAmount = reduce || !hasFine ? 0 : Math.max(0, 1 - progS * 1.6)
      paintWind(windAmount)

      // 식물: 잎 끝의 바람만큼 휘었다가 돌아옴 + 잔잔한 흔들림
      for (const p of plants) {
        const w = sample(p.x, p.baseY - p.h + off) * p.layer.gain
        // 잔잔한 흔들림 — 터치 기기에서는 폭을 40%로 줄임
        // 잔잔한 흔들림 (답변 2026-11-16: 더 자유롭고 부드럽게)
        //  · 바람결: 화면을 가로질러 천천히 지나가는 두 겹의 물결 → 이웃 식물이 시간차를 두고 같이 쓸림
        //  · 하늘거림: 그루마다 빠르기가 다른 두 흔들림을 섞어 제각각 움직임
        if (p.f1 === undefined) {
          p.f1 = 0.7 + Math.random() * 0.9
          p.f2 = 1.6 + Math.random() * 1.4
          p.amp = 0.75 + Math.random() * 0.5
        }
        let idle = 0
        if (!reduce) {
          const gust =
            Math.sin(time * 0.55 - p.x * 0.0026) * 0.6 +
            Math.sin(time * 0.21 - p.x * 0.0011 + 1.3) * 0.4
          const flutter = Math.sin(time * p.f1 + p.phase) * 0.6 + Math.sin(time * p.f2 + p.phase * 1.7) * 0.4
          const depth = 0.55 + 0.45 * p.layer.gain // 앞 겹일수록 크게
          idle = (gust * 0.038 + flutter * 0.02) * p.amp * depth * (touch ? 0.4 : 1) * (1 - 0.5 * s1)
        }
        const target = Math.max(-0.34, Math.min(0.34, w * 0.32)) + idle
        // 스프링을 조금 무르게 → 부드럽게 따라가고 살짝 출렁이며 돌아옴
        p.vel += (target - p.bend) * p.layer.lag * 0.9
        p.vel *= 0.86
        p.bend += p.vel
      }
      lastOff = off
      lastSun = s2
      lastTime = time
      draw(off)

      // ① 흙: 아래에서 올라와 식물 밑동을 덮음, ②로 가면 옅어짐
      if (soilRef.current) {
        soilRef.current.style.opacity = (s1 * (1 - 0.85 * s2)).toFixed(3)
        soilRef.current.style.transform = `translate3d(0, ${((1 - s1) * 60 + off).toFixed(1)}px, 0)`
      }
      // ② 햇빛: 배경이 밝아지고 빛줄기가 들어옴
      if (sunTintRef.current) sunTintRef.current.style.opacity = s2.toFixed(3)
      if (raysRef.current) raysRef.current.style.opacity = s2.toFixed(3)
      if (glowRef.current) glowRef.current.style.opacity = (s2 * SUN.glowStrength).toFixed(3)

      // 문구
      const [c1, c2, c3] = copyRefs.current
      const a1 = 1 - ease(progS * 1.8)
      const a2 = ease((progS - 0.55) * 3) * (1 - ease((progS - 1.35) * 3))
      const a3 = ease((progS - 1.55) * 3)
      if (c1) {
        c1.style.opacity = a1
        c1.style.transform = `translateY(${(-progS * 24).toFixed(1)}px)`
        c1.style.visibility = a1 < 0.02 ? 'hidden' : 'visible'
      }
      if (c2) {
        c2.style.opacity = a2
        c2.style.transform = `translateY(${((1 - a2) * 16).toFixed(1)}px)`
        c2.style.visibility = a2 < 0.02 ? 'hidden' : 'visible'
      }
      if (c3) {
        c3.style.opacity = a3
        c3.style.transform = `translateY(${((1 - a3) * 16).toFixed(1)}px)`
        c3.style.visibility = a3 < 0.02 ? 'hidden' : 'visible'
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      renderer?.dispose()
      cancelAnimationFrame(raf)
      clearTimeout(snapTimer)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={trackRef} className="hero-track">
      <div ref={stageRef} className={`hero-stage${wall ? ' is-wall' : ''}`}>
        <div
          ref={sunTintRef}
          aria-hidden="true"
          className="hero-stage__sun-tint"
          style={{
            // 거의 흰 배경 + 해가 있는 오른쪽 위에만 아주 옅은 노란주황빛
            background: `radial-gradient(circle at ${SUN.glowCenter[0] * 100}% ${SUN.glowCenter[1] * 100}%, rgba(${SUN.warmColor}, ${SUN.warmStrength}) 0%, rgba(${SUN.warmColor}, 0) ${SUN.warmReach}%), ${SUN.background}`,
          }}
        />
        {/* 맨 뒤 정지된 흐릿한 숲 */}
        <canvas ref={backdropRef} aria-hidden="true" className="hero-stage__backdrop" />
        {/* ② 햇빛 — 오른쪽 위에서 퍼지는 큰 빛 (밝게 더하기). 식물 뒤에 둠 — 식물 위에 두면 하얗게 날아감. 식물의 빛은 셰이더(밝기 +15%, 빛 테두리) */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="hero-stage__glow"
          style={{
            '--glow-x': `${SUN.glowCenter[0] * 100}%`,
            '--glow-y': `${SUN.glowCenter[1] * 100}%`,
            '--glow-r': `${SUN.glowRadius * 100}`,
          }}
        />
        <canvas ref={canvasRef} aria-hidden="true" className="hero-stage__canvas" />

        {/* ② 햇빛 — 빛줄기: 식물 위로 비침 */}
        <div
          ref={raysRef}
          aria-hidden="true"
          className="hero-stage__rays"
          style={{ mixBlendMode: SUN.rayLightMode ? 'normal' : 'screen' }}
        >
          {showRays && (
            <SideRays
              key={raysKey}
              rayColor1={SUN.rayColor}
              rayColor2={SUN.rayColor2}
              blend={SUN.rayBlend}
              lightMode={SUN.rayLightMode}
              origin="top-right"
              speed={isTouch ? 0 : 2.5}
              intensity={SUN.rayIntensity}
              glow={SUN.rayGlow}
              saturation={SUN.raySaturation}
              spread={2}
              density={SUN.rayDensity}
              opacity={SUN.rayOpacity}
              followMouse={hasMouse}
            />
          )}
        </div>

        <div
          ref={soilRef}
          aria-hidden="true"
          className="hero-stage__soil"
          style={{ top: `${SOIL.top * 100}vh` }}
        >
          <img src={soil} alt="" />
        </div>

        {/* P1-S1 히어로 — 화면 정가운데 */}
        <section id="top" aria-label="히어로" ref={(el) => (copyRefs.current[0] = el)} className="hero-copy">
          {/* 처음 들어올 때: 제목이 줄마다 아래에서 올라오고, 설명 · 버튼이 제목 밑에서 내려온 뒤 버튼이 한 번 반짝 */}
          <div className="hero-copy__group hero-copy__group--veil hero-intro">
            <h1 className="display-hero">
              <span className="hero-line"><span>잎이 보내는 신호를 읽고</span></span>
              <span className="hero-line"><span>뿌리부터 다시 돌봐요</span></span>
            </h1>
            <p className="hero-copy__desc hero-copy__desc--lg">
              식물이 왜 시드는지 몰라도 괜찮아요.
              <br />
              몇 가지 질문에 답하면 내 식물에 맞는 케어를 같이 찾아 드릴게요.
            </p>
            <Button variant="primary" to={ROUTES.careTest} icon="right" className="hero-copy__btn">
              맞춤 케어 체험 시작
            </Button>
          </div>
        </section>

        {/* P1-S2 장면 ① 흙 — 화면 정가운데 */}
        <section id="products" aria-label="케어 제품" ref={(el) => (copyRefs.current[1] = el)} className="hero-copy hero-copy--later">
          <div className="hero-copy__group">
            <h2 className="hero-copy__title">케어 제품</h2>
            <p className="hero-copy__desc">
              내 식물에 맞는 흙과 영양제를 고르거나,
              <br />
              재료를 직접 섞어 나만의 흙을 만들어 보세요.
            </p>
            <Button variant="scene" to={ROUTES.products} icon="right" className="hero-copy__btn">
              케어 제품 바로가기
            </Button>
          </div>
        </section>

        {/* P1-S2 장면 ② 햇빛 — 화면 정가운데 */}
        <section id="guide" aria-label="케어 가이드" ref={(el) => (copyRefs.current[2] = el)} className="hero-copy hero-copy--later">
          <div className="hero-copy__group">
            <h2 className="hero-copy__title">케어 가이드</h2>
            <p className="hero-copy__desc">
              물 주기, 햇빛, 분갈이, 벌레 대처까지.
              <br />
              처음 키우는 분도 따라 하기 쉽게 정리했어요.
            </p>
            <Button variant="scene" to={ROUTES.guide} icon="right" className="hero-copy__btn">
              케어 가이드 보기
            </Button>
          </div>
        </section>

        {/* 월페이퍼 모드의 빛 알갱이 */}
        <div aria-hidden="true" className="hero-motes">
          {motes.map((m, i) => (
            <span
              key={i}
              style={{ left: m.left, '--size': m.size, '--dur': m.dur, '--delay': m.delay, '--drift': m.drift }}
            />
          ))}
        </div>

        {/* 오른쪽 아래 작은 버튼들 — 커서 켜기 · 끄기(PC에서만) + 월페이퍼(누르면 글씨 · 메뉴가 사라지고 배경만 남음, 다시 누르거나 Esc로 돌아옴) */}
        <div className={`hero-tools${wall ? ' is-wall' : ''}`}>
          {cursorReady && (
            <button
              type="button"
              className={`hero-tool-btn hero-cursor-btn${cursorOn ? '' : ' is-off'}`}
              aria-pressed={cursorOn}
              onClick={toggleCursor}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 3l14 7-6 2-2 6z" />
              </svg>
              {cursorOn ? '커서 끄기' : '커서 켜기'}
            </button>
          )}
          <button
            type="button"
            className={`hero-tool-btn hero-wall-btn${wall ? ' is-on' : ''}`}
            aria-pressed={wall}
            onClick={() => setWall((w) => !w)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {wall ? (
                <path d="M4 7h16M4 12h10M4 17h13" />
              ) : (
                <>
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M3 16l5-5 4 4 3-3 6 6" />
                </>
              )}
            </svg>
            {wall ? '글씨 보기' : '월페이퍼'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroScene
