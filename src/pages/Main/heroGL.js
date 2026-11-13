// P1 히어로 식물 밭 — WebGL2 인스턴스 렌더러
// 겹마다 깊이(배경색 섞기 · 채도 · 밝기 · 흐림 · 불투명도), 겹 사이 공기층, 앞 겹 그림자, 아래쪽 그늘,
// 그루마다 색 변화(aColorShift)를 셰이더에서 처리
import { SOURCES } from './heroField.js'
import { LOOK, SUN } from './heroConfig.js'

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

const BG = [0xea / 255, 0xf3 / 255, 0xdc / 255] // #EAF3DC
const SHADOW = [0x1f / 255, 0x2a / 255, 0x22 / 255] // #1F2A22

// 겹별 설정은 heroConfig.js의 LOOK — 0 맨 뒤 키 큰 식물 · 1 가운데 큰 잎 · 2 뒤 · 3 중간 · 4 앞
const LAYER_LOOK = [LOOK.tallBack, LOOK.center, LOOK.back, LOOK.mid, LOOK.front]
const LAYER_TEX = ['back', 'center', 'back', 'mid', 'sharp']
const LAYER_COUNT = LAYER_LOOK.length

// 텍스처 흐림 (텍스처 px). 텍스처 높이 512 ≈ 화면에서 식물 높이 약 250~350px 기준
const TEX_H = 512
const PAD = 32
const BLUR_BACK = 7 // 화면 약 4px
const BLUR_MID = 2 // 화면 약 1px
const BLUR_CENTER = 3 // 가운데 큰 잎 (화면 약 3px)
const BLUR_SHADOW = 20 // 화면 약 12px

const VERT = `#version 300 es
layout(location=0) in vec2 aCorner;      // x: -0.5~0.5, y: 0(밑동)~1(끝)
layout(location=1) in vec4 aBase;        // x, baseY, w, h
layout(location=2) in vec2 aRotFlip;     // 회전(rad), 좌우 뒤집기(1/-1)
layout(location=3) in vec4 aUV;          // u0, v0, u1, v1 (아틀라스)
layout(location=4) in vec3 aColorShift;  // 색조(rad), 채도, 밝기
layout(location=5) in vec2 aPad;         // 아틀라스 여백 비율 (흐림 번짐용)
uniform vec2 uView;
uniform vec2 uOffset;                    // 배경 이동 + 그림자 이동
out vec2 vUV;
out float vV;
out vec3 vShift;
out float vFlip;
out vec2 vScreen; // 화면 위치(px)
void main() {
  // 흐림이 번질 여백만큼 사각형을 넓힘
  vec2 c = aCorner;
  vec2 grow = vec2(1.0 + 2.0 * aPad.x, 1.0 + 2.0 * aPad.y);
  vec2 local = vec2(c.x * aBase.z * grow.x, -((c.y * grow.y) - aPad.y) * aBase.w);
  float s = sin(aRotFlip.x), co = cos(aRotFlip.x);
  vec2 rotated = vec2(local.x * co - local.y * s, local.x * s + local.y * co);
  vec2 pos = vec2(aBase.x, aBase.y) + rotated + uOffset;
  gl_Position = vec4(pos.x / uView.x * 2.0 - 1.0, 1.0 - pos.y / uView.y * 2.0, 0.0, 1.0);
  vScreen = pos;
  float u = c.x * aRotFlip.y + 0.5;
  vUV = vec2(mix(aUV.x, aUV.z, u), mix(aUV.w, aUV.y, c.y));
  vV = (c.y * grow.y) - aPad.y; // 0 = 밑동, 1 = 끝 (식물 기준)
  vShift = aColorShift;
  vFlip = aRotFlip.y;
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in float vV;
in vec3 vShift;
in float vFlip;
in vec2 vScreen;
uniform sampler2D uTex;
uniform vec2 uLightPos;   // 빛이 들어오는 자리(px)
uniform float uDiag;      // 화면 대각선(px)
uniform float uTime;
uniform vec3 uShaftA;     // 빛 색 ① 흰빛
uniform vec3 uShaftB;     // 빛 색 ② 레몬옐로
uniform float uShaftMix;
uniform float uShafts;    // 가닥 수
uniform float uShaftStrength;
uniform float uShaftReach;
uniform float uShaftSpeed;
uniform vec2 uTexel;     // 텍스처 한 칸 크기
uniform float uSun;      // 햇빛 장면 진행도 0~1
uniform float uSunBoost; // 햇빛 장면 식물 밝기
uniform vec3 uBg;
uniform float uMix;
uniform float uSat;
uniform float uBright;
uniform float uAlpha;
uniform float uShadow;    // 1이면 그림자 패스
uniform vec3 uShadowColor;
out vec4 outColor;

vec3 hueRotate(vec3 c, float a) {
  // YIQ 색공간에서 색조 회전
  mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * c;
  float ca = cos(a), sa = sin(a);
  yiq.yz = vec2(yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

void main() {
  vec4 t = texture(uTex, vUV);
  if (uShadow > 0.5) {
    float a = t.a * uAlpha;
    outColor = vec4(uShadowColor * a, a);
    return;
  }
  if (t.a < 0.003) discard;
  vec3 c = t.rgb / t.a; // 아틀라스는 premultiplied
  // 그루마다 색 변화
  c = hueRotate(c, vShift.x);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 1.0 + vShift.y);
  c *= 1.0 + vShift.z;
  // 겹마다 채도 · 밝기
  l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 1.0 + uSat);
  c *= 1.0 + uBright;
  // 아래쪽 그늘: 밑동 쪽 30% 구간에서 최대 -20%
  float shade = 1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.3, vV));
  c *= shade;
  // 햇빛 장면: 식물 밝기 올리기 + 오른쪽 위를 향한 잎 가장자리에 옅은 따뜻한 빛 테두리
  if (uSun > 0.001) {
    c *= 1.0 + uSunBoost * uSun;
    vec2 toLight = vec2(vFlip, -1.0) * uTexel * 4.0;
    float outside = 1.0 - texture(uTex, vUV + toLight).a;
    float rim = clamp(t.a * outside, 0.0, 1.0);
    c += vec3(1.0, 0.97, 0.78) * rim * 0.35 * uSun;

    // 식물 위로 드는 빛줄기: 오른쪽 위에서 비스듬히 내려오는 부드러운 줄기 (식물에만 비침)
    vec2 d = vScreen - uLightPos;
    float dist = length(d) / uDiag;
    float ang = atan(d.y, d.x);
    float t = uTime * uShaftSpeed;
    float s1 = 0.5 + 0.5 * sin(ang * uShafts * 6.2832 / 1.6 + t);
    float s2 = 0.5 + 0.5 * sin(ang * uShafts * 1.7 * 6.2832 / 1.6 - t * 0.7 + 1.3);
    float shaft = pow(s1, 3.0) * 0.7 + pow(s2, 4.0) * 0.3;
    float reach = exp(-pow(dist / uShaftReach, 2.0) * 1.6);
    float light = shaft * reach * uShaftStrength * uSun;
    // 줄기마다 흰빛 ↔ 레몬옐로가 섞이도록
    vec3 shaftColor = mix(uShaftA, uShaftB, clamp(uShaftMix + (s2 - 0.5) * 0.6, 0.0, 1.0));
    c = c + (shaftColor - c * 0.35) * light;
  }
  // 멀수록 배경색에 섞임
  c = mix(c, uBg, uMix);
  c = clamp(c, 0.0, 1.0);
  float a = t.a * uAlpha;
  outColor = vec4(c * a, a);
}`

// 공기층: 화면 세로 그라데이션 (배경색, 위 0 → 아래 0.35)
const AIR_VERT = `#version 300 es
layout(location=0) in vec2 aCorner;
out float vY;
void main() {
  vec2 p = aCorner + 0.5; // 0~1
  vY = p.y;
  gl_Position = vec4(p.x * 2.0 - 1.0, p.y * 2.0 - 1.0, 0.0, 1.0);
}`
const AIR_FRAG = `#version 300 es
precision highp float;
in float vY;           // 0 = 화면 아래, 1 = 위
uniform vec3 uBg;
uniform float uStart;  // 그라데이션이 시작되는 높이(아래에서 비율)
out vec4 outColor;
void main() {
  float a = 0.35 * (1.0 - smoothstep(0.0, uStart, vY));
  outColor = vec4(uBg * a, a);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s))
    return null
  }
  return s
}

function program(gl, vs, fs) {
  const p = gl.createProgram()
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p))
    return null
  }
  const u = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)
    u[info.name] = gl.getUniformLocation(p, info.name)
  }
  return { p, u }
}

// 식물 12장을 한 장의 아틀라스로 (선명 · 중간 흐림 · 뒤 흐림 · 그림자 흐림 4벌)
function buildAtlases(bitmaps) {
  const names = Object.keys(SOURCES).filter((n) => bitmaps[n])
  const cells = names.map((n) => {
    const img = bitmaps[n]
    const w = Math.round((img.width / img.height) * TEX_H)
    return { name: n, img, w, h: TEX_H }
  })
  const cols = 6
  const rows = Math.ceil(cells.length / cols)
  const cellW = Math.max(...cells.map((c) => c.w)) + PAD * 2
  const cellH = TEX_H + PAD * 2
  const W = cellW * cols
  const H = cellH * rows
  const uv = {}
  cells.forEach((c, i) => {
    const x = (i % cols) * cellW + (cellW - c.w) / 2
    const y = Math.floor(i / cols) * cellH + PAD
    c.x = x
    c.y = y
    // 여백까지 포함한 UV (흐림이 번질 자리)
    uv[c.name] = {
      u0: (x - PAD) / W,
      v0: (y - PAD) / H,
      u1: (x + c.w + PAD) / W,
      v1: (y + TEX_H + PAD) / H,
      padX: PAD / c.w,
      padY: PAD / TEX_H,
    }
  })
  const make = (blur) => {
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d')
    if (blur) ctx.filter = `blur(${blur}px)`
    cells.forEach((c) => ctx.drawImage(c.img, c.x, c.y, c.w, c.h))
    return cv
  }
  return { uv, W, H, sharp: make(0), mid: make(BLUR_MID), center: make(BLUR_CENTER), back: make(BLUR_BACK), shadow: make(BLUR_SHADOW) }
}

const FLOATS = 4 + 2 + 4 + 3 + 2

export function createRenderer(canvas, bitmaps) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true })
  if (!gl) return null
  const plantProg = program(gl, VERT, FRAG)
  const airProg = program(gl, AIR_VERT, AIR_FRAG)
  if (!plantProg || !airProg) return null

  const atlas = buildAtlases(bitmaps)
  const textures = {}
  ;['sharp', 'mid', 'center', 'back', 'shadow'].forEach((k) => {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas[k])
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    textures[k] = tex
  })

  // 사각형 꼭짓점
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, 0, 0.5, 0, -0.5, 1, 0.5, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const inst = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, inst)
  const stride = FLOATS * 4
  const attr = (loc, size, offset) => {
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4)
    gl.vertexAttribDivisor(loc, 1)
  }
  attr(1, 4, 0)
  attr(2, 2, 4)
  attr(3, 4, 6)
  attr(4, 3, 10)
  attr(5, 2, 13)
  gl.bindVertexArray(null)

  // 공기층용 사각형
  const airVao = gl.createVertexArray()
  gl.bindVertexArray(airVao)
  const airBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, airBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)

  let data = new Float32Array(0)
  const ranges = Array.from({ length: LAYER_COUNT }, () => [0, 0])

  function upload(plants) {
    if (data.length < plants.length * FLOATS) data = new Float32Array(plants.length * FLOATS)
    // plants는 겹 순서로 정렬되어 있음
    let k = 0
    let n = 0
    for (let li = 0; li < LAYER_COUNT; li++) ranges[li] = [0, 0]
    plants.forEach((p) => {
      const uv = atlas.uv[p.name]
      if (!uv) return
      if (ranges[p.layerIndex][1] === 0) ranges[p.layerIndex][0] = n
      ranges[p.layerIndex][1] += 1
      n += 1
      data[k++] = p.x
      data[k++] = p.baseY
      data[k++] = p.w
      data[k++] = p.h
      data[k++] = p.bend * 0.5 // 사진 한 장을 통째로 기울이므로 절반
      data[k++] = p.flip
      data[k++] = uv.u0
      data[k++] = uv.v0
      data[k++] = uv.u1
      data[k++] = uv.v1
      data[k++] = p.color[0]
      data[k++] = p.color[1]
      data[k++] = p.color[2]
      data[k++] = uv.padX
      data[k++] = uv.padY
    })
    gl.bindBuffer(gl.ARRAY_BUFFER, inst)
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, k), gl.DYNAMIC_DRAW)
  }

  let sun = 0
  let time = 0
  function drawLayer(li, texKey, look, offY, shadow = false) {
    const [first, count] = ranges[li]
    if (!count) return
    const { p, u } = plantProg
    gl.useProgram(p)
    gl.bindVertexArray(vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, textures[texKey])
    gl.uniform1i(u.uTex, 0)
    gl.uniform2f(u.uView, canvas.clientWidth, canvas.clientHeight)
    gl.uniform2f(u.uOffset, 0, offY + (shadow ? 6 : 0))
    gl.uniform3f(u.uBg, BG[0], BG[1], BG[2])
    gl.uniform1f(u.uMix, look.mix)
    gl.uniform1f(u.uSat, look.sat)
    gl.uniform1f(u.uBright, look.bright)
    gl.uniform1f(u.uAlpha, shadow ? 0.16 : look.alpha)
    gl.uniform1f(u.uShadow, shadow ? 1 : 0)
    gl.uniform3f(u.uShadowColor, SHADOW[0], SHADOW[1], SHADOW[2])
    gl.uniform2f(u.uTexel, 1 / atlas.W, 1 / atlas.H)
    gl.uniform1f(u.uSun, shadow ? 0 : sun)
    gl.uniform1f(u.uSunBoost, SUN.plantBoost)
    const vw = canvas.clientWidth
    const vh = canvas.clientHeight
    const pl = SUN.plantLight
    gl.uniform2f(u.uLightPos, SUN.glowCenter[0] * vw, SUN.glowCenter[1] * vh)
    gl.uniform1f(u.uDiag, Math.hypot(vw, vh))
    gl.uniform1f(u.uTime, time)
    gl.uniform3fv(u.uShaftA, hex(pl.colorA))
    gl.uniform3fv(u.uShaftB, hex(pl.colorB))
    gl.uniform1f(u.uShaftMix, pl.mix)
    gl.uniform1f(u.uShafts, pl.shafts)
    gl.uniform1f(u.uShaftStrength, pl.strength)
    gl.uniform1f(u.uShaftReach, pl.reach)
    gl.uniform1f(u.uShaftSpeed, pl.speed)
    // 해당 겹의 인스턴스만 그리기: 속성 시작 위치를 옮김
    gl.bindBuffer(gl.ARRAY_BUFFER, inst)
    const stride = FLOATS * 4
    const base = first * stride
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, base)
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, base + 16)
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, base + 24)
    gl.vertexAttribPointer(4, 3, gl.FLOAT, false, stride, base + 40)
    gl.vertexAttribPointer(5, 2, gl.FLOAT, false, stride, base + 52)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
  }

  function drawAir() {
    const { p, u } = airProg
    gl.useProgram(p)
    gl.bindVertexArray(airVao)
    gl.uniform3f(u.uBg, BG[0], BG[1], BG[2])
    // 화면 아래에서 60% 높이까지 옅어지는 판
    gl.uniform1f(u.uStart, 0.6)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  return {
    // sunAmount: 햇빛 장면 진행도 0~1
    draw(plants, off, sunAmount = 0, seconds = 0) {
      sun = sunAmount
      time = seconds
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      upload(plants)
      drawLayer(0, LAYER_TEX[0], LAYER_LOOK[0], off)
      drawLayer(1, LAYER_TEX[1], LAYER_LOOK[1], off)
      drawLayer(2, LAYER_TEX[2], LAYER_LOOK[2], off)
      drawAir()
      drawLayer(3, LAYER_TEX[3], LAYER_LOOK[3], off)
      drawLayer(4, 'shadow', LAYER_LOOK[4], off, true)
      drawLayer(4, LAYER_TEX[4], LAYER_LOOK[4], off)
    },
    dispose() {
      Object.values(textures).forEach((t) => gl.deleteTexture(t))
      gl.deleteBuffer(quad)
      gl.deleteBuffer(inst)
      gl.deleteBuffer(airBuf)
      gl.deleteVertexArray(vao)
      gl.deleteVertexArray(airVao)
      gl.deleteProgram(plantProg.p)
      gl.deleteProgram(airProg.p)
    },
  }
}
