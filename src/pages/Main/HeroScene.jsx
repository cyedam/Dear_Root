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
 * - ② 햇빛: 밝게 더하기(screen)로 섞는 큰 빛 + SideRays 빛줄기
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

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches

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
    const draw = (off) => {
      if (renderer) renderer.draw(plants, off, lastSun)
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
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

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
      prog = Math.max(0, Math.min(2, -top / window.innerHeight))
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
    const t0 = performance.now()
    const frame = (now) => {
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
      const windAmount = reduce || touch ? 0 : Math.max(0, 1 - progS * 1.6)
      paintWind(windAmount)

      // 식물: 잎 끝의 바람만큼 휘었다가 돌아옴 + 잔잔한 흔들림
      for (const p of plants) {
        const w = sample(p.x, p.baseY - p.h + off) * p.layer.gain
        const idle = reduce ? 0 : Math.sin(time * 1.6 + p.phase + p.x * 0.004) * 0.025 * (1 - 0.5 * s1)
        const target = Math.max(-0.32, Math.min(0.32, w * 0.32)) + idle
        p.vel += (target - p.bend) * p.layer.lag * 1.4
        p.vel *= 0.78
        p.bend += p.vel
      }
      lastOff = off
      lastSun = s2
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
      <div ref={stageRef} className="hero-stage">
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
        {/* ② 햇빛 — 빛줄기 (밝게 더하기) */}
        <div ref={raysRef} aria-hidden="true" className="hero-stage__rays">
          {showRays && (
            <SideRays
              key={raysKey}
              rayColor1={SUN.rayColor}
              rayColor2={SUN.rayColor}
              origin="top-right"
              speed={2.5}
              intensity={2}
              spread={2}
              density={SUN.rayDensity}
              sharpness={0.3}
              opacity={SUN.rayOpacity}
              followMouse={true}
            />
          )}
        </div>

        <canvas ref={canvasRef} aria-hidden="true" className="hero-stage__canvas" />

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
          <div className="hero-copy__group hero-copy__group--veil">
            <h1 className="display-hero">
              잎이 보내는 신호를 읽고
              <br />
              뿌리부터 다시 돌봐요
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
      </div>
    </div>
  )
}

export default HeroScene
