/* Puffy Pals 웹 커서 — 말랑하게 따라오는 캐릭터 (의존성 없음, 파일 1개)
 *
 *   <script src="dist/acorn/theme.js"></script>
 *   <script src="puffy-web-cursor.js"></script>
 *   <script>PuffyCursor.init({ theme: 'acorn' });</script>
 *
 * 화살표는 브라우저 기본 그대로 두고, 캐릭터가 옆에서 따라옴 (클릭 위치는 늘 정확).
 * 표정: 기본(normal) · 뚜껑 열림(open) · 웃음(happy)
 *   빠르게 움직임 = 열림, 링크·버튼 위 = 웃음, 누르는 중 = 열림 + 찌그러짐, 뗀 뒤 잠깐 = 웃음, 그 밖 = 기본
 * 날아가기 (데스크톱 FLEE_STYLE "paper"와 같은 식): 클릭하면 바람에 날려 펄럭이며 돌다가 곡선으로 돌아와 방긋.
 *   테마에 부품(part)이 있으면 몸통은 그 자리에 남고 부품(도토리 뚜껑)만 날아감. 연속 클릭엔 쉬는 시간.
 * 굴러가기 (테마 motion "roll", 데스크톱 MOTION과 같음): 마우스가 가로로 움직인 만큼 몸통 가운데를 축으로 데굴데굴,
 *   0.15초 멈추면 오뚝이처럼 살짝 흔들리다 바로 섬.
 * 굴러 나가기 (테마 flee "roll", 데스크톱 FLEE_STYLE "roll"과 같은 식, 털실): 클릭하면 툭 튀어 올랐다 바닥에서 데굴데굴 굴러 나가며
 *   실 그림 띠를 지나간 길에 깔고(풀린 만큼 뭉치가 작아짐), 실을 감으며 굴러 돌아와 뿅 뛰어 제자리. 화면 끝 쪽이면 반대로 굴러감.
 * 터치 기기·'동작 줄이기' 설정에서는 켜지지 않음 (respectReducedMotion: false로 바꿀 수 있음)
 * 베어 먹기 (테마 flee "bite", 2026-11-01 쿠키): 클릭할 때마다 한 입씩(bite1→bite2→bite3) 찌그러지며 먹히고, 마지막 입 뒤 biteReset ms가 지나면 뿅 하고 새 쿠키로.
 * 끄기 버튼 (2026-11-01, 원칙: 거슬리면 손님이 끌 수 있게): 화면 구석 작은 동그라미 버튼. 끈 상태는 손님 브라우저(localStorage)에 기억.
 *   toggle: false로 버튼 숨김(사이트가 직접 PuffyCursor.setEnabled(false/true)로 끄고 켬)
 */
(function () {
  'use strict';

  var DEFAULTS = {
    theme: null,            // window.PUFFY_THEMES의 이름
    size: 44,               // 화면에 보이는 캐릭터 크기(px). 2026-11-03 웹 커서 44px 정도(사용자) → 48에서 44
    offset: [22, 18],       // 마우스에서 떨어진 자리(px), 캐릭터 기준점이 여기에 옴
    gap: null,              // [가로, 세로] px: 주면 offset 대신 씀. 캐릭터 그림 왼쪽 위가 마우스에서 오른쪽·아래로 이만큼 (크기와 상관없이 화살표와 띄움)
    threadWidth: null,      // 실 굵기(px). 없으면 테마 값 (캐릭터 크기에 비례)
    rollOut: null,          // 굴러 나가기(털실) 값 덮어쓰기 {pop, speed, gravity, friction, stop, rest, back, hop, hopTime, ...}
    stiffness: 0.12,        // 따라오는 힘 (클수록 바짝)
    damping: 0.72,          // 남는 속도 비율 (작을수록 덜 출렁)
    squash: 0.0025,         // 속도에 따라 늘어나는 정도
    maxSquash: 0.22,
    tilt: 0.06,             // 가로 속도에 따른 기울기(도/px)
    maxTilt: 14,
    openSpeed: 6,           // 이 속도(px/프레임)를 넘으면 뚜껑 열림
    happyAfterClick: 500,   // 뗀 뒤 웃는 시간(ms)
    clickPop: 0.28,         // 클릭할 때 찌그러졌다 튀는 세기
    rollDamp: null,         // 구르다 멈출 때 바로 서며 넘쳤다 돌아오는 것을 잡는 힘. 없으면 ROLL.damp (클수록 덜 출렁, 쿠키 2026-11-03)
    fly: true,              // 클릭하면 날아갔다 돌아오기
    flyDistance: 0.6,       // 날아가는 거리 배율 (데스크톱 = 1, 웹 화면은 좁아서 기본 0.6)
    flyCooldown: 1200,      // 돌아온 뒤 다시 날 때까지 쉬는 시간(ms)
    paperFlaps: null,       // 종이 날기에서 뒤집히며 팔랑이는 횟수. 없으면 PAPER.tumbleSpeed대로(약 3~5번). 몬스테라 2 (2026-11-16 사용자 "2번만 팔랑여라")
    happyAfterFly: 1000,    // 돌아와서 웃는 시간(ms)
    biteReset: 900,         // 베어 먹기: 마지막 입 뒤 새 쿠키로 돌아올 때까지(ms)
    zIndex: 2147483000,
    respectReducedMotion: true,
    disableOnTouch: true,
    toggle: true,           // 끄기 버튼 보이기
    toggleCorner: 'left',   // 버튼 자리: 'left'(왼쪽 아래) · 'right'(오른쪽 아래) — 사이트 채팅 버튼과 안 겹치는 쪽
    toggleOffset: [16, 16], // 화면 모서리에서 [가로, 세로] px
    toggleLabels: ['따라오는 캐릭터 끄기', '따라오는 캐릭터 켜기'],
    storageKey: 'puffyCursorOff'   // 끈 상태를 기억하는 localStorage 이름 ('1' = 꺼짐)
  };
  var PAPER = {             // 데스크톱 puffy_pals.pyw 값 (도토리 theme.json 덮어쓴 값 포함). 속도·거리는 flyDistance를 곱함
    speed: 700, time: [0.9, 1.5], wind: 220, gust: 480, gustFreq: 1.3, drag: 2.8,
    flutter: 1500, flutterFreq: 1.4, gravity: 260, spin: [360, 900],
    tumbleSpeed: 0.55 * (1 + 1.5 + 4), tumble: 0.45,   // TUMBLE_SPEED × (1 + FLEE_BOOST + PAPER_TUMBLE), LEAF_TUMBLE
    returnTime: 0.6, bow: [70, 160], edge: 60, edgePush: 2500
  };
  var ROLLOUT = {           // 데스크톱 5-2 굴러 나가기 값. 속도·힘은 flyDistance를 곱함
    pop: 520, speed: 480, gravity: 2200, bounce: 0.35, friction: 1.8, rest: 0.35, back: 430, hop: 26, hopTime: 0.38,
    edge: 60, turn: 300,                    // turn: 가는 쪽 화면 끝까지 이만큼(px×flyDistance)도 안 남으면 반대로
    stop: 40,                               // 이 속도(px/초×flyDistance) 아래로 느려지면 멈춘 것으로 봄
    plane: false, curve: 1.2, popStyle: 'bump', popScale: 0.22, popTime: 0.22   // 평면 굴러 나가기 (위 startPlane)
  };   // 옵션 rollOut: {...}으로 테마·사이트마다 덮어씀 (바늘이야기 털실은 빠르게: theme defaults)
  var THREAD = { step: 2, smooth: 6, maxLen: 250, rewindDelay: 0.4, rewind: 320, spin: 0.35, cols: 160 };   // 데스크톱 THREAD_*
  var ROLL = { settleAfter: 0.15, stiff: 110, damp: 9 * 0.8 };   // SETTLE_AFTER, TILT_STIFF, TILT_DAMP × 0.8
  var POINTER_SEL = 'a[href],button:not(:disabled),[role="button"],label,select,summary,.puffy-pointer';

  var st = null, bound = [], cfg = null, btn = null;

  function supported(o) {
    if (o.disableOnTouch && window.matchMedia && !matchMedia('(any-hover: hover)').matches) return false;
    if (o.respectReducedMotion && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function file(t, n) { return t.base + (t.img || 'png/') + n + '.' + (t.ext || 'png'); }   // 예전 테마(png/…png)도 그대로 읽음
  function pickSize(t, need) {   // 화면에 필요한 픽셀보다 큰 것 중 가장 작은 그림 (36px·2배 화면 → 128)
    var ss = (t.sizes || [128, 256]).slice().sort(function (a, b) { return a - b; });
    for (var i = 0; i < ss.length; i++) if (ss[i] >= need) return ss[i];
    return ss[ss.length - 1];
  }
  function stored() { try { return localStorage.getItem(cfg.o.storageKey) === '1'; } catch (e) { return false; } }

  function makeImg(o) {
    var img = document.createElement('img');
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.draggable = false;
    img.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;user-select:none;opacity:0;' +
      'transition:opacity .2s;will-change:transform;width:' + o.size + 'px;height:' + o.size + 'px;z-index:' + o.zIndex;
    document.body.appendChild(img);
    return img;
  }

  function init(opts) {
    destroy();
    var o = {}, k;
    var themes = window.PUFFY_THEMES || {};
    var t = themes[(opts || {}).theme || DEFAULTS.theme] || themes[Object.keys(themes)[0]];
    if (!t) { console.warn('[PuffyCursor] 테마가 없어요: theme.js를 먼저 불러오세요'); return false; }
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in t.defaults || {}) o[k] = t.defaults[k];   // 테마 기본값 (바늘이야기 털실·쿠키: size 44, gap [18, 22])
    for (k in opts || {}) o[k] = opts[k];
    if (!supported(o)) return false;
    cfg = { o: o, t: t };
    if (o.toggle) makeButton();
    if (!stored()) start();
    return true;
  }

  function makeButton() {      // 끄기·켜기 버튼: 캐릭터 그림(가장 작은 것)을 줄여 넣음, 끄면 흐린 회색
    var o = cfg.o, t = cfg.t;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'puffy-cursor-toggle';
    btn.style.cssText = 'position:fixed;bottom:' + o.toggleOffset[1] + 'px;' + (o.toggleCorner === 'right' ? 'right:' : 'left:') + o.toggleOffset[0] + 'px;' +
      'width:34px;height:34px;padding:0;margin:0;border:1px solid rgba(0,0,0,.12);border-radius:50%;background:rgba(255,255,255,.92);' +
      'box-shadow:0 1px 4px rgba(0,0,0,.15);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:' + o.zIndex;
    var ic = document.createElement('img');
    ic.alt = '';
    ic.draggable = false;
    ic.src = file(t, ((t.same || {}).normal || 'normal') + '_' + pickSize(t, 0));
    ic.style.cssText = 'width:24px;height:24px;pointer-events:none;transition:filter .2s,opacity .2s';
    btn.appendChild(ic);
    btn.addEventListener('click', function () { setEnabled(!st); });
    document.body.appendChild(btn);
    updateButton();
  }

  function updateButton() {
    if (!btn) return;
    var on = !!st, label = cfg.o.toggleLabels[on ? 0 : 1];
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.firstChild.style.filter = on ? 'none' : 'grayscale(1)';
    btn.firstChild.style.opacity = on ? '1' : '.45';
  }

  function setEnabled(on) {    // 사이트·버튼에서 끄고 켬. 손님 브라우저에 기억
    if (!cfg) return false;
    try { if (on) localStorage.removeItem(cfg.o.storageKey); else localStorage.setItem(cfg.o.storageKey, '1'); } catch (e) {}
    if (on && !st) start();
    if (!on) stop();
    updateButton();
    return !!st;
  }

  function start() {
    var o = cfg.o, t = cfg.t;
    var px = pickSize(t, o.size * (window.devicePixelRatio || 1));   // 선명하게: 필요한 것보다 조금 큰 그림을 줄여 씀
    var src = {}, same = t.same || {};
    t.states.concat(t.part ? ['body', 'part'] : [], t.bites || []).forEach(function (s) {   // 미리 불러 둠 (깜빡이지 않게). 똑같은 그림은 한 번만
      src[s] = file(t, (same[s] || s) + '_' + px);
      new Image().src = src[s];
    });
    var img = makeImg(o), partImg = null;
    if (t.part) {             // 날아가는 부품: 부품 가운데를 축으로 돎
      partImg = makeImg(o);
      partImg.src = src.part;
      partImg.style.transition = 'none';
      partImg.style.transformOrigin = t.part.center[0] * o.size + 'px ' + t.part.center[1] * o.size + 'px';
    }

    var canvas = null, endImg = null;
    if (t.thread) {           // 실: 화면 전체 캔버스(클릭 안 막음)에 실 그림 띠의 얇은 단면을 길 따라 찍음
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:' + (o.zIndex - 1);
      document.body.appendChild(canvas);
      var timg = new Image();
      timg.onload = function () {   // 실 그림 띠 → 160칸 × 2px 단면용 띠 (데스크톱 thread_slice와 같은 틀)
        if (!st || st.canvas !== canvas) return;
        var d = Math.max(1, Math.min(2, window.devicePixelRatio || 1)), tex = document.createElement('canvas');
        var w = o.threadWidth || t.thread.width * o.size;
        tex.height = Math.max(2, Math.round(w * d));   // tile: 꼬임 띠는 원래 비율 그대로 반복 (가늘어도 꼬임이 안 늘어남)
        tex.width = t.thread.tile ? Math.max(8, Math.round(tex.height * timg.naturalWidth / timg.naturalHeight))
                                  : Math.round((THREAD.cols * THREAD.step + 2) * d);
        var tg = tex.getContext('2d');
        tg.imageSmoothingQuality = 'high';
        tg.drawImage(timg, 0, 0, tex.width, tex.height);
        st.tex = tex; st.texD = d;
      };
      timg.src = file(t, 'thread');
      if (t.thread.end) { endImg = new Image(); endImg.src = file(t, 'thread_end'); }
    }

    st = { o: o, t: t, img: img, partImg: partImg, src: src, canvas: canvas, canvasD: 1, tex: null, texD: 1, endImg: endImg,
           thread: null, threadLen: 0, threadStill: 0, winding: false, drawn: false, scale: 1, face: '', mx: 0, my: 0, x: 0, y: 0, vx: 0, vy: 0,
           pop: 0, popV: 0, down: false, hover: false, happyUntil: 0, shown: false, raf: 0,
           bite: 0, biteReset: 0, fly: null, flyReady: 0, lastT: 0, roll: 0, rollV: 0, dmx: 0, moved: false, still: 0 };
    setFace('normal');
    on(document, 'pointerdown', onPointer);   // 손가락 터치로 생긴 마우스 이벤트는 무시하려고 마지막 입력 종류를 기억
    on(document, 'pointermove', onPointer);
    on(document, 'mousemove', onMove);
    on(document, 'mousedown', onDown);
    on(document, 'mouseup', onUp);
    on(document.documentElement, 'mouseleave', onLeave);
    on(window, 'blur', onLeave);
    if (canvas) { on(window, 'resize', fitCanvas); fitCanvas(); }
    st.raf = requestAnimationFrame(tick);
    updateButton();
  }

  function on(el, ev, fn) { el.addEventListener(ev, fn, { passive: true }); bound.push([el, ev, fn]); }

  function destroy() {
    stop();
    if (btn) btn.remove();
    btn = null;
    cfg = null;
  }

  function stop() {
    if (!st) return;
    cancelAnimationFrame(st.raf);
    bound.forEach(function (b) { b[0].removeEventListener(b[1], b[2]); });
    bound = [];
    st.img.remove();
    if (st.partImg) st.partImg.remove();
    if (st.canvas) st.canvas.remove();
    st = null;
  }

  function target() {          // 캐릭터 그림의 왼쪽 위가 가야 할 자리
    var o = st.o, tip = st.t.tip;
    if (o.gap) return [st.mx + o.gap[0], st.my + o.gap[1]];
    return [st.mx + o.offset[0] - tip[0] * o.size, st.my + o.offset[1] - tip[1] * o.size];
  }

  /* 터치 무시 (Dear Root 2026-11-16, 사용자 "클릭만 잡히면 될 것 같아요"): 터치 화면 노트북에서
   * 손가락으로 누르면 브라우저가 마우스 이벤트를 흉내 내서 보내는데, 그건 따라가지도 날아가지도 않음 */
  function onPointer(e) { st.ptr = e.pointerType; }
  function fromTouch(e) {
    return st.ptr === 'touch' || st.ptr === 'pen' || !!(e && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents);
  }

  function onMove(e) {
    if (fromTouch(e)) return;
    if (st.shown && (e.clientX !== st.mx || e.clientY !== st.my)) { st.dmx += e.clientX - st.mx; st.moved = true; }   // 굴러가기: 마우스가 가로로 간 거리
    st.mx = e.clientX; st.my = e.clientY;
    st.hover = !!(e.target && e.target.closest && e.target.closest(POINTER_SEL));
    if (!st.shown) {           // 처음 들어올 때는 그 자리에서 나타남
      if (!st.fly) { var p = target(); st.x = p[0]; st.y = p[1]; st.vx = st.vy = 0; }
      st.shown = true; st.img.style.opacity = '1';
      if (st.fly && st.partImg) st.partImg.style.opacity = '1';
      if (st.canvas) st.canvas.style.opacity = '1';
    }
  }
  function onDown(e) {
    if (fromTouch(e)) return;
    st.down = true; st.popV -= st.o.clickPop;
    if (st.t.flee === 'bite') return takeBite();
    if (st.o.fly && st.shown && !st.fly && performance.now() >= st.flyReady) startFly();
  }
  function onUp(e) { if (fromTouch(e) && !st.down) return; st.down = false; st.popV += st.o.clickPop * 0.6; st.happyUntil = performance.now() + st.o.happyAfterClick; }
  function onLeave() {
    st.shown = false; st.img.style.opacity = '0';
    if (st.partImg) st.partImg.style.opacity = '0';
    if (st.canvas) st.canvas.style.opacity = '0';
  }

  function takeBite() {         // 한 입: 다음 그림으로 바꾸고 조금 더 세게 찌그러짐. 다 먹은 뒤엔 새 쿠키 기다리는 중이라 무시
    var n = (st.t.bites || []).length;
    if (!n || st.bite >= n) return;
    st.bite++;
    st.popV -= st.o.clickPop * 0.5;
    if (st.bite === n) st.biteReset = performance.now() + st.o.biteReset;
  }

  function setFace(f) {
    if (st.face === f) return;
    st.face = f;
    st.img.src = st.src[f] || st.src.normal;
  }

  /* ── 날아가기 (데스크톱 state "flee" → "return") ── */
  function rollOn() { return st.t.motion === 'roll' && st.t.roll; }
  function norm(a) { return ((a + 180) % 360 + 360) % 360 - 180; }

  function startFly() {
    if (st.t.flee === 'roll' && !st.partImg) return startRollOut();
    var o = st.o, k = o.flyDistance, sz = o.size, tip = st.t.tip;
    var th = rollOn() ? norm(st.roll) : 0, off = [0, 0];   // 굴러서 기운 몸통 위 뚜껑 제자리 (몸통 축으로 돌린 자리)
    if (st.partImg && th) {
      var P = st.t.roll.pivot, C = st.t.part.center, a = th * Math.PI / 180;
      var vx = (C[0] - P[0]) * sz, vy = (C[1] - P[1]) * sz;
      off = [vx * Math.cos(a) - vy * Math.sin(a) + (P[0] - C[0]) * sz, vx * Math.sin(a) + vy * Math.cos(a) + (P[1] - C[1]) * sz];
    }
    if (rollOn()) st.roll = th;
    var cx = st.x + tip[0] * sz, cy = st.y + tip[1] * sz;   // 마우스에서 멀어지는 쪽으로 (조금 랜덤)
    var base = (cx === st.mx && cy === st.my ? rand(0, 2 * Math.PI) : Math.atan2(cy - st.my, cx - st.mx)) + rand(-0.6, 0.6);
    st.fly = {
      phase: 'flee', t: 0, x: st.x + off[0], y: st.y + off[1], base: base, off: off, homeAng: th,
      vx: Math.cos(base) * PAPER.speed * k, vy: Math.sin(base) * PAPER.speed * k,
      dur: rand(PAPER.time[0], PAPER.time[1]), ang: th,
      spin: (Math.random() < 0.5 ? -1 : 1) * rand(PAPER.spin[0], PAPER.spin[1]),
      tumble: 0, width: 1,
      ph: [0, 1, 2, 3, 4].map(function () { return rand(0, 2 * Math.PI); })
    };
    if (st.partImg) { st.partImg.style.opacity = '1'; st.vx = st.vy = 0; }   // 몸통은 멈춤 (늘어난 채 굳지 않게)
  }

  /* ── 굴러 나가기 (데스크톱 FLEE_STYLE "roll", 캐릭터 통째로) ── */
  function rollR() { return st.t.roll.radius * st.o.size * st.scale; }   // 실이 풀려 작아진 만큼 반지름도 작아짐
  function pivot(x, y) { var P = st.t.roll.pivot; return [x + P[0] * st.o.size, y + P[1] * st.o.size]; }

  function rollOut() {        // 굴러 나가기 값 = 기본 + rollOut 옵션
    var R = {}, k;
    for (k in ROLLOUT) R[k] = ROLLOUT[k];
    for (k in st.o.rollOut || {}) R[k] = st.o.rollOut[k];
    return R;
  }

  /* 평면 굴러 나가기 (rollOut.plane, 바늘이야기 털실): 웹엔 바닥이 없으니 화면 위 평면에서 아무 방향으로.
   * 매번 랜덤 각도(화면 끝에 닿을 방향은 빼고) → 살짝 휘며 굴러 나가 멈춤 → 깔린 실을 따라 되감으며 돌아와 →
   * 실이 다 감기면 지금 커서 오른쪽 아래 자리로 곧장(대각선). 회전 = 움직인 거리 ÷ 반지름.
   * 시작 느낌 popStyle: "bump" = 제자리에서 툭 커졌다 작아짐, "hop" = 화면 위로 살짝 뛰어오름 (그림만, 실은 바닥 자리) */
  function startPlane(R, k, c, th) {
    var W = innerWidth, H = innerHeight, m = R.edge, v0 = R.speed * k, reach = (v0 - R.stop * k) / R.friction + m;
    var a = 0, ok = false;
    for (var i = 0; i < 24 && !ok; i++) {     // 멈출 자리가 화면 안인 방향만 (곡선 여유 포함)
      a = rand(0, 2 * Math.PI);
      var ex = c[0] + Math.cos(a) * reach, ey = c[1] + Math.sin(a) * reach;
      ok = ex > m && ex < W - m && ey > m && ey < H - m;
    }
    if (!ok) a = Math.atan2(H / 2 - c[1], W / 2 - c[0]);   // 어디도 안 되면 화면 가운데 쪽으로
    st.fly = {
      phase: 'flee', style: 'roll', plane: true, t: 0, x: st.x, y: st.y, ang: th, width: 1, rest: 0, vb: 0,
      vx: Math.cos(a) * v0, vy: Math.sin(a) * v0, curve: rand(-1, 1) * R.curve, lift: 0, bump: 1
    };
  }

  function stepPlane(dt, now, R, k) {
    var f = st.fly, o = st.o, sz = o.size, P = st.t.roll.pivot, W = innerWidth, H = innerHeight;
    f.age = (f.age || 0) + dt;
    var p = Math.min(1, f.age / R.popTime), s = Math.sin(Math.PI * p);   // 시작할 때 툭 (돌아올 땐 안 함)
    f.bump = R.popStyle === 'bump' ? 1 + R.popScale * s : 1;
    f.lift = R.popStyle === 'hop' ? R.hop * s : 0;
    var c = pivot(f.x, f.y), mv = 0, sx = 0;
    if (f.phase === 'flee') {
      var ca = Math.cos(f.curve * dt), sa = Math.sin(f.curve * dt);   // 살짝 휘어 감
      var vx = f.vx * ca - f.vy * sa, vy = f.vx * sa + f.vy * ca, damp = Math.exp(-R.friction * dt);
      f.vx = vx * damp; f.vy = vy * damp;
      if ((c[0] < R.edge && f.vx < 0) || (c[0] > W - R.edge && f.vx > 0)) f.vx = -f.vx * 0.6;   // 화면 끝에서 튕김
      if ((c[1] < R.edge && f.vy < 0) || (c[1] > H - R.edge && f.vy > 0)) f.vy = -f.vy * 0.6;
      f.x += f.vx * dt; f.y += f.vy * dt;
      mv = Math.sqrt(f.vx * f.vx + f.vy * f.vy) * dt; sx = f.vx || f.vy;
      if (Math.sqrt(f.vx * f.vx + f.vy * f.vy) < R.stop * k) f.rest += dt;
      if (f.rest > R.rest || f.t > 4) { f.phase = 'return'; f.t = 0; }
    } else {
      f.vb = Math.min(R.back * k, f.vb + R.back * k * 4 * dt);   // 천천히 출발
      var left = f.vb * dt, pts = st.thread, x = c[0], y = c[1], i = 1;
      while (pts && left > 0 && i < pts.length) {   // 깔린 실을 따라 되감으며 (실 꼬리 = 굴러 나간 자리)
        var d = dist([x, y], pts[i]);
        if (d <= left) { x = pts[i][0]; y = pts[i][1]; left -= d; i++; }
        else { x += (pts[i][0] - x) * left / d; y += (pts[i][1] - y) * left / d; left = 0; }
      }
      var home = target(), hp = pivot(home[0], home[1]);
      if (left > 0) {                            // 실을 다 감았으면 지금 커서 오른쪽 아래 자리로 곧장
        var dh = dist([x, y], hp), g = Math.min(left, dh);
        if (dh > 0) { x += (hp[0] - x) * g / dh; y += (hp[1] - y) * g / dh; }
      }
      mv = dist([x, y], c); sx = (x - c[0]) || (y - c[1]);
      f.x += x - c[0]; f.y += y - c[1];
      if (((!pts || st.threadLen < 1) && dist([x, y], hp) < 1) || f.t > 2.5) {   // 도착 (커서가 계속 도망가도 2.5초 뒤엔 쏙)
        st.x = home[0]; st.y = home[1]; st.vx = st.vy = 0;
        st.roll = f.ang; st.rollV = 0;            // 멈추면 굴러가기 스프링이 바로 세움
        st.fly = null;
        st.flyReady = now + o.flyCooldown;
        st.happyUntil = now + o.happyAfterFly;
        st.winding = !!st.thread;
        return;
      }
    }
    f.ang += (sx < 0 ? -1 : 1) * mv / rollR() * 180 / Math.PI;
  }

  function startRollOut() {
    var o = st.o, k = o.flyDistance, R = rollOut(), sz = o.size, th = rollOn() ? norm(st.roll) : 0;
    st.roll = th;
    var c = pivot(st.x, st.y);   // 마우스에서 멀어지는 쪽으로, 그쪽 화면 끝이 가까우면 반대로
    if (R.plane) {
      startPlane(R, k, c, th);
      st.vx = st.vy = 0;
      if (st.t.thread) { st.thread = [c]; st.threadLen = 0; st.threadStill = 0; st.winding = false; }
      return;
    }
    var d = (c[0] === st.mx ? Math.random() < 0.5 : c[0] > st.mx) ? 1 : -1;
    if ((d > 0 && c[0] > innerWidth - R.turn * k) || (d < 0 && c[0] < R.turn * k)) d = -d;
    st.fly = {
      phase: 'flee', style: 'roll', t: 0, x: st.x, y: st.y, ang: th, width: 1, rest: 0, vb: 0, hop: null,
      vx: d * R.speed * 0.5 * k, vy: -R.pop * k, kick: d * R.speed * k * rand(0.85, 1.15),
      floor: Math.min(st.y, innerHeight - sz)   // 굴러갈 바닥 = 지금 높이 (화면 아래 밖이면 안쪽)
    };
    st.vx = st.vy = 0;
    if (st.t.thread) { st.thread = [c]; st.threadLen = 0; st.threadStill = 0; st.winding = false; }
  }

  function stepRollOut(dt, now) {
    var f = st.fly, o = st.o, k = o.flyDistance, R = rollOut(), sz = o.size, P = st.t.roll.pivot;
    f.t += dt;
    if (f.plane) return stepPlane(dt, now, R, k);
    if (f.phase === 'flee') {
      f.vy += R.gravity * k * dt;
      var nx = f.x + f.vx * dt;
      f.y += f.vy * dt;
      if (f.y >= f.floor) {                     // 바닥: 통통 튀다가 데굴데굴
        f.y = f.floor;
        if (f.kick) { f.vx = f.kick; f.kick = 0; }   // 처음 닿는 순간 옆으로 데구르르
        f.vy = f.vy > 150 * k ? -f.vy * R.bounce : 0;
        f.vx *= Math.exp(-R.friction * dt);
      }
      var cx = nx + P[0] * sz;
      if ((cx < R.edge && f.vx < 0) || (cx > innerWidth - R.edge && f.vx > 0)) f.vx = -f.vx * 0.6;   // 화면 끝에서 튕김
      f.ang += (nx - f.x) / rollR() * 180 / Math.PI;
      f.x = nx;
      if (f.y >= f.floor && f.vy === 0 && Math.abs(f.vx) < R.stop * k) f.rest += dt;
      if (f.rest > R.rest || f.t > 4) { f.phase = 'return'; f.t = 0; }
    } else {
      var home = target(), hx = home[0], hy = home[1];
      if (!f.hop) {                             // 바닥을 굴러 제자리 옆까지 (지나온 실을 되밟으며 감음)
        var tx = hx + (f.x > hx ? 1 : -1) * st.t.roll.radius * sz;
        f.vb = Math.min(R.back * k, f.vb + R.back * k * 4 * dt);   // 천천히 출발
        var step = Math.max(-f.vb * dt, Math.min(f.vb * dt, tx - f.x));
        f.ang += step / rollR() * 180 / Math.PI;
        f.x += step; f.y = f.floor;
        if (Math.abs(tx - f.x) < 1 || f.t > 2.5) f.hop = [f.x, f.y, f.ang, f.t];   // 커서가 계속 도망가도 2.5초 뒤엔 뛰어듦
      } else {                                  // 뿅 뛰어 제자리로, 바로 서며 들어감
        var h = f.hop, p = Math.min(1, (f.t - h[3]) / R.hopTime), e = 1 - Math.pow(1 - p, 3);
        var lift = R.hop + Math.max(0, h[1] - hy) / 2;
        f.x = h[0] + (hx - h[0]) * p;
        f.y = h[1] + (hy - h[1]) * p - lift * Math.sin(Math.PI * p);
        f.ang = h[2] + norm(-h[2]) * e;
        if (p >= 1) {
          st.x = f.x; st.y = f.y; st.vx = st.vy = 0;
          st.roll = Math.round(f.ang / 360) * 360; st.rollV = 0;
          st.fly = null;
          st.flyReady = now + o.flyCooldown;
          st.happyUntil = now + o.happyAfterFly;
          st.winding = !!st.thread;               // 남은 실은 따라가며 감음
        }
      }
    }
  }

  /* ── 실 (데스크톱 TRAIL_STYLE "thread": thread_update·thread_cut·draw_thread와 같은 식) ── */
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function threadLength(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; }
  function threadCut(pts, amount) {         // 실 끝(꼬리 쪽)에서 amount(px)만큼 감아 없앰
    while (amount > 0 && pts.length > 1) {
      var a = pts[pts.length - 2], b = pts[pts.length - 1], d = dist(a, b);
      if (d <= amount) { pts.pop(); amount -= d; }
      else { var f = amount / d; pts[pts.length - 1] = [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f]; amount = 0; }
    }
  }
  function threadUpdate(pts, x, y, still, dt, wind) {
    var wound = false;
    while (pts.length > 1) {                 // 왔던 길을 되밟음(실에서 8px 안) → 그만큼 감김
      var x0 = pts[0][0], y0 = pts[0][1], vx = pts[1][0] - x0, vy = pts[1][1] - y0, vv = vx * vx + vy * vy;
      if (vv < 1e-6) { pts.shift(); continue; }
      var f = ((x - x0) * vx + (y - y0) * vy) / vv;
      if (f <= 0 || Math.abs((x - x0) * vy - (y - y0) * vx) / Math.sqrt(vv) > 8) break;
      wound = true;
      if (f < 1) break;
      pts.shift();
    }
    var add = wound ? 0 : dist([x, y], pts[0]);
    if (wound || add <= 1.5) pts[0] = [x, y]; else pts.unshift([x, y]);
    if (wind != null) threadCut(pts, add + wind);   // 돌아오는 중·돌아온 뒤: 더 풀리지 않음(늘어난 만큼 + 감는 만큼 끝에서 감음)
    if (!wind && still > THREAD.rewindDelay) threadCut(pts, THREAD.rewind * dt);
    var len = threadLength(pts);
    if (len > THREAD.maxLen) { threadCut(pts, len - THREAD.maxLen); len = THREAD.maxLen; }
    return len;
  }

  function stepThread(dt) {
    var f = st.fly, c = f ? pivot(f.x, f.y) : pivot(st.x, st.y), pts = st.thread;
    st.threadStill = dist(c, pts[0]) > 1.5 ? 0 : st.threadStill + dt;
    var len = threadUpdate(pts, c[0], c[1], st.threadStill, dt,
                           st.winding ? THREAD.rewind * dt : f && f.phase === 'return' ? 0 : null);
    if (st.winding && pts.length > 1 && rollOn()) {   // 제자리에서 실 쪽으로 구르듯 뱅글뱅글 돌며 감음
      st.roll += (pts[1][0] >= pts[0][0] ? 1 : -1) * THREAD.spin * (st.threadLen - len) / rollR() * 180 / Math.PI;
    }
    st.threadLen = len;
    st.scale = 1 - (1 - st.t.thread.minScale) * len / THREAD.maxLen;
    if (st.winding && len < 0.5) { st.thread = null; st.winding = false; st.threadLen = 0; st.scale = 1; }
  }

  function fitCanvas() {
    var d = window.devicePixelRatio || 1;
    st.canvas.width = Math.round(innerWidth * d); st.canvas.height = Math.round(innerHeight * d);
    st.canvasD = d; st.drawn = false;
  }

  function drawThread() {
    var cv = st.canvas, g = cv.getContext('2d'), pts = st.thread;
    if (st.drawn) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); st.drawn = false; }
    if (!pts || pts.length < 2 || !st.tex) return;
    var seg = [0], i, total;
    for (i = 1; i < pts.length; i++) seg.push(seg[i - 1] + dist(pts[i - 1], pts[i]));
    total = seg[seg.length - 1];
    if (total <= THREAD.step * 2) return;
    var line = [], j = 1, n, r = THREAD.smooth, s;
    for (s = 0; s <= total; s += THREAD.step) {   // 같은 간격으로 다시 찍기
      while (j < seg.length - 1 && seg[j] < s) j++;
      var s0 = seg[j - 1], s1 = seg[j], q = s1 === s0 ? 0 : (s - s0) / (s1 - s0);
      line.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * q, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * q]);
    }
    n = line.length;
    for (var pass = 0; pass < 2; pass++) {    // 앞뒤 평균 두 번 → 꺾인 곳이 둥글게
      var sm = [];
      for (i = 0; i < n; i++) {
        var a = Math.max(0, i - r), b = Math.min(n - 1, i + r), sx = 0, sy = 0;
        for (var m = a; m <= b; m++) { sx += line[m][0]; sy += line[m][1]; }
        sm.push([sx / (b - a + 1), sy / (b - a + 1)]);
      }
      line = sm;
    }
    var D = st.canvasD, td = st.texD, w = st.tex.height / td, cw = THREAD.step + 2;
    g.setTransform(D, 0, 0, D, 0, 0);
    for (i = n - 1; i >= 0; i--) {             // 꼬리 끝부터 → 캐릭터 쪽이 위에 겹침
      var pa = line[Math.max(0, i - 1)], pb = line[Math.min(n - 1, i + 1)];
      var sx = st.t.thread.tile   // 반복: 실 길이 위치대로 / 아니면 띠 1장을 최대 길이에 폄 (데스크톱 색 띠)
        ? Math.min((i * THREAD.step * td) % st.tex.width, st.tex.width - cw * td)
        : Math.min(THREAD.cols - 1, Math.floor(i * THREAD.step / THREAD.maxLen * THREAD.cols)) * THREAD.step * td;
      g.save(); g.translate(line[i][0], line[i][1]); g.rotate(Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) + Math.PI);
      g.drawImage(st.tex, sx, 0, cw * td, st.tex.height, -cw / 2, -w / 2, cw, w);
      g.restore();
    }
    var e = st.endImg;
    if (e && e.complete && e.naturalWidth && n > 2) {   // 실 끝 조각 (있을 때만)
      var t0 = line[n - 1], t1 = line[Math.max(0, n - 4)], eh = w * 4, ew = eh * e.naturalWidth / e.naturalHeight;
      g.save(); g.translate(t0[0], t0[1]); g.rotate(Math.atan2(t0[1] - t1[1], t0[0] - t1[0]));
      g.drawImage(e, -ew * 0.08, -eh * 0.9, ew, eh); g.restore();   // 끝 조각의 왼쪽 아래(실과 이어지는 쪽)가 실 끝에 겹침
    }
    st.drawn = true;
  }

  function stepFly(dt, now) {
    if (st.fly.style === 'roll') return stepRollOut(dt, now);
    var f = st.fly, o = st.o, k = o.flyDistance, P = PAPER, sz = o.size;
    f.t += dt;
    if (f.phase === 'flee') {
      var ph = f.ph, calm = Math.max(0, 1 - f.t / f.dur);          // 바람이 점점 잦아듦
      var g = 2 * Math.PI * P.gustFreq * f.t;
      var gx = Math.sin(g + ph[0]) + 0.5 * Math.sin(2.3 * g + ph[1]);
      var gy = Math.sin(1.3 * g + ph[2]) + 0.5 * Math.sin(2.9 * g + ph[3]);
      var wx = (Math.cos(f.base) * P.wind * calm + P.gust * gx * Math.sqrt(calm)) * k;
      var wy = (Math.sin(f.base) * P.wind * calm + P.gust * gy * Math.sqrt(calm)) * k;
      var kd = 1 - Math.exp(-P.drag * dt);                          // 바람에 실려 감
      f.vx += (wx - f.vx) * kd;
      f.vy += (wy - f.vy) * kd;
      var sp = Math.sqrt(f.vx * f.vx + f.vy * f.vy) || 1;
      var flutter = P.flutter * k * Math.sin(2 * Math.PI * P.flutterFreq * f.t + ph[4]);
      f.vx += -f.vy / sp * flutter * dt;                            // 진행 방향 옆으로 펄럭이며 휨
      f.vy += f.vx / sp * flutter * dt;
      f.vy += P.gravity * k * dt;
      var cx = f.x + sz / 2, cy = f.y + sz / 2, W = innerWidth, H = innerHeight, push = P.edgePush * k * dt;
      if (cx < P.edge) f.vx += push;                                // 창 가장자리에서 되밀기
      if (cx > W - P.edge) f.vx -= push;
      if (cy < P.edge) f.vy += push;
      if (cy > H - P.edge) f.vy -= push;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.x = Math.min(Math.max(f.x, -sz / 2), W - sz / 2);
      f.y = Math.min(Math.max(f.y, -sz / 2), H - sz / 2);
      f.spin = f.spin * Math.exp(-1.2 * dt) + flutter / k * 0.25 * dt;
      f.ang += f.spin * dt;
      f.tumble += dt * 2 * Math.PI * (o.paperFlaps ? o.paperFlaps / f.dur : P.tumbleSpeed);   // paperFlaps: 날아가는 동안 딱 그 횟수만
      f.width = 1 - P.tumble * (1 - Math.cos(f.tumble));            // 1 → 0 → 음수(뒷면)
      if (f.t >= f.dur) {
        f.phase = 'return'; f.t = 0;
        f.from = [f.x, f.y]; f.ang0 = norm(f.ang - f.homeAng); f.w0 = f.width;
        f.bow = (Math.random() < 0.5 ? -1 : 1) * rand(P.bow[0], P.bow[1]) * k;
      }
    } else {
      var p = Math.min(1, f.t / P.returnTime), e = 1 - Math.pow(1 - p, 3);
      var home = st.partImg ? [st.x + f.off[0], st.y + f.off[1]] : target();   // 뚜껑 → 몸통 위 제자리, 아니면 따라가는 자리
      var fx = f.from[0], fy = f.from[1], hx = home[0], hy = home[1];
      var dx = hx - fx, dy = hy - fy, dl = Math.sqrt(dx * dx + dy * dy) || 1;
      var bx = (fx + hx) / 2 - dy / dl * f.bow, by = (fy + hy) / 2 + dx / dl * f.bow;   // 옆으로 휘어 돌아옴
      f.x = (1 - e) * (1 - e) * fx + 2 * (1 - e) * e * bx + e * e * hx;
      f.y = (1 - e) * (1 - e) * fy + 2 * (1 - e) * e * by + e * e * hy;
      f.ang = f.homeAng + f.ang0 * (1 - e);
      f.width = f.w0 * (1 - e) + e;
      if (p >= 1) {
        if (!st.partImg) { st.x = f.x; st.y = f.y; }
        st.vx = st.vy = 0;
        st.fly = null;
        st.flyReady = now + o.flyCooldown;
        st.happyUntil = now + o.happyAfterFly;                      // 돌아와서 방긋
        if (st.partImg) st.partImg.style.opacity = '0';
      }
    }
  }

  function tick(now) {
    var o = st.o, dt = Math.min(0.05, st.lastT ? (now - st.lastT) / 1000 : 0);
    st.lastT = now;
    var f = st.fly, partFly = f && st.partImg;

    if (!partFly) {            // 뚜껑이 날아가는 동안 몸통은 놀라서 그 자리에 가만히
      var p = target();
      st.vx = (st.vx + (p[0] - st.x) * o.stiffness) * o.damping;
      st.vy = (st.vy + (p[1] - st.y) * o.stiffness) * o.damping;
      st.x += st.vx; st.y += st.vy;
    }
    if (st.winding) st.moved = true;   // 실을 감으며 도는 동안은 바로 서지 않음
    if (rollOn() && !f) {         // 데굴데굴 (날아가는 동안은 그대로 멈춤) (데스크톱 메인 루프의 MOTION == "roll"과 같은 식)
      var deg = st.dmx / (st.t.roll.radius * o.size) * 180 / Math.PI;
      st.still = st.moved ? 0 : st.still + dt;
      st.roll += deg;
      if (st.still > ROLL.settleAfter) {          // 멈추면 가까운 바로 선 자세로, 살짝 넘쳤다 돌아옴
        var goal = Math.round(st.roll / 360) * 360;
        st.rollV += ((goal - st.roll) * ROLL.stiff - st.rollV * (o.rollDamp || ROLL.damp)) * dt;
        st.roll += st.rollV * dt;
      } else st.rollV = dt ? deg / dt : 0;        // 구르던 기세를 이어받음
    }
    st.dmx = 0; st.moved = false;
    st.popV = (st.popV - st.pop * 0.25) * 0.78;   // 클릭 튀김: 작은 용수철
    st.pop += st.popV;
    if (f) stepFly(dt, now);
    f = st.fly;
    if (st.thread) stepThread(dt);
    if (st.canvas) drawThread();

    var speed = Math.sqrt(st.vx * st.vx + st.vy * st.vy);
    var s = Math.min(o.maxSquash, speed * o.squash * 10);
    var ang = Math.max(-o.maxTilt, Math.min(o.maxTilt, st.vx * o.tilt * 10));
    var sx = 1 + s - st.pop, sy = 1 - s * 0.7 + st.pop;   // 움직이면 가로로 늘고, 누르면 납작

    if (st.biteReset && now >= st.biteReset) { st.bite = 0; st.biteReset = 0; st.popV += st.o.clickPop * 1.2; }   // 새 쿠키 뿅
    if (st.bite) setFace(st.t.bites[st.bite - 1]);
    else if (f && st.partImg) setFace('body');
    else if (f || st.down || speed > o.openSpeed) setFace('open');
    else if (st.happyUntil > now || st.hover) setFace('happy');
    else setFace('normal');

    var tip = st.t.tip, ox = tip[0] * o.size, oy = tip[1] * o.size;
    var sc = st.scale;
    if (f && f.style === 'roll') {   // 굴러 나가기: 몸통 축으로 굴러간 각도, 풀린 만큼 작게
      var Q = st.t.roll.pivot;
      st.img.style.transformOrigin = Q[0] * o.size + 'px ' + Q[1] * o.size + 'px';
      st.img.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + (f.y - (f.lift || 0)).toFixed(1) + 'px,0) scale(' +
        (sc * (f.bump || 1)).toFixed(3) + ') rotate(' + f.ang.toFixed(1) + 'deg)';
    } else if (f && !st.partImg) {    // 캐릭터 통째로 날아감
      st.img.style.transformOrigin = ox + 'px ' + oy + 'px';
      st.img.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px,0) rotate(' +
        f.ang.toFixed(1) + 'deg) scale(' + f.width.toFixed(3) + ',1)';
    } else if (rollOn()) {     // 몸통 축으로 굴러간 각도, 누르면 화면 기준으로 납작
      var P = st.t.roll.pivot;
      st.img.style.transformOrigin = P[0] * o.size + 'px ' + P[1] * o.size + 'px';
      st.img.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,0) scale(' +
        (sc * (1 - st.pop)).toFixed(3) + ',' + (sc * (1 + st.pop)).toFixed(3) + ') rotate(' + st.roll.toFixed(1) + 'deg)';
    } else {                   // 기준점을 중심으로 늘고 기울어짐
      st.img.style.transformOrigin = ox + 'px ' + oy + 'px';
      st.img.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,0) rotate(' +
        ang.toFixed(1) + 'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
    }
    if (f && st.partImg) {
      st.partImg.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px,0) rotate(' +
        f.ang.toFixed(1) + 'deg) scale(' + f.width.toFixed(3) + ',1)';
    }
    st.raf = requestAnimationFrame(tick);
  }

  window.PuffyCursor = { init: init, destroy: destroy, setEnabled: setEnabled,
    isEnabled: function () { return !!st; }, defaults: DEFAULTS };
})();
