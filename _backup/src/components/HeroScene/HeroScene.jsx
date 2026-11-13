import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header.jsx';
import { ROUTES } from '../../routes.js';
import { TUNING, DEFAULT_TUNING, SCROLL_FOLLOW } from './config.js';
import { createScene, hasWebGL, smooth } from './scene.js';
import { fallbackImageUrl } from './atlas.js';
import './HeroScene.css';

/**
 * P1 hero: 300vh track with a sticky 100vh stage.
 * Copy, buttons and GNB are DOM over the canvas and show immediately (no loading screen).
 * If WebGL or images fail, a still image (if provided) replaces the canvas; copy stays.
 */
export default function HeroScene() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const c1Ref = useRef(null);
  const c2Ref = useRef(null);
  const c3Ref = useRef(null);
  const debugStateRef = useRef(null);
  const [mode, setMode] = useState('loading'); // loading | ready | fallback
  const [debug] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug'));

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    // a fresh canvas per mount: dispose() force-loses the WebGL context, so a canvas can't be reused
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvasRef.current.appendChild(canvas);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const motion = !reduce && !touch;

    let scene = null;
    let alive = true;
    const fail = () => {
      if (!alive) return;
      scene?.dispose();
      scene = null;
      setMode('fallback');
    };

    if (hasWebGL()) {
      try {
        scene = createScene(canvas, { motion, onContextLost: fail });
        const r = stage.getBoundingClientRect();
        scene.resize(r.width, r.height);
        scene.ready
          .then(() => {
            if (!alive) return;
            canvas.classList.add('is-ready');
            setMode('ready');
          })
          .catch(fail);
      } catch {
        fail();
      }
    } else {
      fail();
    }

    // ---- scroll progress → copy + scene
    let progress = 0;
    let progS = 0;
    const readScroll = () => {
      const top = section.getBoundingClientRect().top;
      progress = Math.max(0, Math.min(2, -top / window.innerHeight));
    };
    readScroll();
    progS = progress;

    const setCopy = (el, opacity, transform) => {
      if (!el) return;
      el.style.opacity = opacity;
      el.style.transform = transform;
      el.style.visibility = opacity < 0.02 ? 'hidden' : 'visible';
    };

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let inView = true;
    let pageVisible = !document.hidden;

    const frame = (now) => {
      raf = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      progS += (progress - progS) * (reduce ? 1 : SCROLL_FOLLOW);
      if (Math.abs(progress - progS) < 0.0005) progS = progress;

      const a1 = 1 - smooth(progS * 1.8);
      setCopy(c1Ref.current, a1, `translateY(${-progS * 24}px)`);
      const a2 = smooth((progS - 0.55) * 3) * (1 - smooth((progS - 1.35) * 3));
      setCopy(c2Ref.current, a2, `translateY(calc(-50% + ${(1 - a2) * 16}px))`);
      const a3 = smooth((progS - 1.55) * 3);
      setCopy(c3Ref.current, a3, `translateY(calc(-50% + ${(1 - a3) * 16}px))`);

      scene?.render(dt, (now - t0) / 1000, progS);

      if (debugStateRef.current) {
        debugStateRef.current.textContent =
          progS < 0.5 ? '장면 1 · 히어로 (바람)' : progS < 1.5 ? `장면 2 · 흙 (배경 아래로 ${TUNING.scrollShift}px)` : `장면 3 · 햇빛 (배경 위로 ${TUNING.scrollShift}px)`;
      }
      schedule();
    };
    const schedule = () => {
      if (!raf && inView && pageVisible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // ---- pause off-screen / hidden tab
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) schedule();
      else stop();
    });
    io.observe(section);
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) schedule();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ---- resize
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      scene?.resize(width, height);
    });
    ro.observe(stage);

    // ---- pointer (mouse / pen only; touch is ignored inside wind)
    const onMove = (e) => {
      if (!scene || !motion) return;
      const r = stage.getBoundingClientRect();
      scene.pointerMove(e.clientX - r.left, e.clientY - r.top, e.pointerType);
    };
    const onLeave = () => scene?.pointerLeave();
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);

    schedule();

    return () => {
      alive = false;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
      scene?.dispose();
      scene = null;
      canvas.remove();
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero" aria-label="Dear Root 소개">
      <div ref={stageRef} className="hero__stage">
        {mode === 'fallback' && fallbackImageUrl && <img className="hero__fallback" src={fallbackImageUrl} alt="" />}
        {/* the effect appends a canvas it owns (fresh per mount: dispose() force-loses the context) */}
        <div ref={canvasRef} className="hero__canvas-host" />

        <Header overlay />

        <div ref={c1Ref} className="hero__copy hero__copy--center">
          <h1 className="hero__title">
            잎이 보내는 신호를 읽고
            <br />
            뿌리부터 다시 돌봐요
          </h1>
          <div className="hero__bottom">
            <p className="hero__text">
              식물이 왜 시드는지 몰라도 괜찮아요.
              <br />
              몇 가지 질문에 답하면 내 식물에 맞는 케어를 같이 찾아 드릴게요.
            </p>
            <Link to={ROUTES.careTest} className="btn btn--primary">
              맞춤 케어 체험 시작
            </Link>
          </div>
        </div>

        <div ref={c2Ref} className="hero__copy hero__copy--side" style={{ opacity: 0, visibility: 'hidden' }}>
          <h2 className="hero__subtitle">케어 제품</h2>
          <p className="hero__text hero__text--side">
            내 식물에 맞는 흙과 영양제를 고르거나,
            <br />
            재료를 직접 섞어 나만의 흙을 만들어 보세요.
          </p>
          <Link to={ROUTES.products} className="btn btn--scene">
            케어 제품 바로가기 <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div ref={c3Ref} className="hero__copy hero__copy--side" style={{ opacity: 0, visibility: 'hidden' }}>
          <h2 className="hero__subtitle">케어 가이드</h2>
          <p className="hero__text hero__text--side">
            물 주기, 햇빛, 분갈이, 벌레 대처까지.
            <br />
            처음 키우는 분도 따라 하기 쉽게 정리했어요.
          </p>
          <Link to={ROUTES.guide} className="btn btn--scene">
            케어 가이드 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      {debug && <DebugPanel stateRef={debugStateRef} />}
    </section>
  );
}

const SLIDERS = [
  { key: 'windStrength', label: '바람 세기', min: 0, max: 2, step: 0.05 },
  { key: 'windRadius', label: '바람 범위', min: 0.03, max: 0.16, step: 0.005 },
  { key: 'windHalfLife', label: '자국 남는 시간', min: 0.08, max: 0.6, step: 0.01 },
  { key: 'maxBend', label: '최대 휨(rad)', min: 0.1, max: 0.6, step: 0.01 },
  { key: 'scrollShift', label: '배경 이동(px)', min: 0, max: 60, step: 1 },
];

/** Dev-only tuning panel, shown with ?debug. Edits TUNING live. */
function DebugPanel({ stateRef }) {
  const [, force] = useState(0);
  return (
    <div className="hero-debug">
      <b>조절값 (개발용)</b>
      {SLIDERS.map((s) => (
        <label key={s.key}>
          <span>
            {s.label} <em>{TUNING[s.key]}</em>
          </span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={TUNING[s.key]}
            onChange={(e) => {
              TUNING[s.key] = +e.target.value;
              force((n) => n + 1);
            }}
          />
        </label>
      ))}
      <div className="hero-debug__state" ref={stateRef} />
      <button
        type="button"
        onClick={() => {
          Object.assign(TUNING, DEFAULT_TUNING);
          force((n) => n + 1);
        }}
      >
        기본값으로
      </button>
    </div>
  );
}
