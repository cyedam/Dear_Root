import * as THREE from 'three';
import { TUNING, LAYERS, LAYOUT, SUN, COLORS, MAX_DPR } from './config.js';
import { createWind } from './wind.js';
import { plantVertexShader, plantFragmentShader, sunVertexShader, sunFragmentShader } from './plantShader.js';
import { buildPlantAtlas, buildSoilTexture } from './atlas.js';

const STEP = 1 / 60; // the springs and wind followers are tuned per 60fps frame

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/**
 * Creates the three.js hero scene on `canvas`.
 * Throws if WebGL is unavailable. `ready` rejects if images fail to load.
 * Draw order (back → front): sun, plants back / mid / front, soil — 5 draw calls.
 */
export function createScene(canvas, { motion = true, onContextLost } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));

  const handleLost = (e) => {
    e.preventDefault();
    onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', handleLost);

  const scene = new THREE.Scene();
  // pixel units: 1 scene unit = 1 CSS px, y up; screen point (x, y) is scene (x, -y)
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  camera.position.z = 5;

  const wind = createWind();
  let W = 0;
  let H = 0;
  let disposed = false;
  let isReady = false;
  let acc = 0;

  // ---------- sun (full-screen shader)
  const quad = new THREE.PlaneGeometry(1, 1);
  const sunMat = new THREE.ShaderMaterial({
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2() },
      uRadius: { value: 1 },
      uAmount: { value: 0 },
      // authored in sRGB, written straight out
      uTint: { value: srgbVec(COLORS.sunTint) },
      uCore: { value: srgbVec(COLORS.sunCore) },
      uMid: { value: srgbVec(COLORS.sunMid) },
      uRay: { value: srgbVec(COLORS.ray) },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const sun = new THREE.Mesh(quad, sunMat);
  sun.renderOrder = 0;
  sun.frustumCulled = false;
  scene.add(sun);

  // ---------- plants
  const plantGroup = new THREE.Group();
  scene.add(plantGroup);
  const plantBaseGeo = new THREE.PlaneGeometry(1, 1, 1, 16);
  plantBaseGeo.translate(0, 0.5, 0); // origin at the base

  const haze = new THREE.Color(COLORS.hero);
  const plantMats = LAYERS.map(
    (L) =>
      new THREE.ShaderMaterial({
        vertexShader: plantVertexShader,
        fragmentShader: plantFragmentShader,
        uniforms: {
          uAtlas: { value: null },
          uHazeColor: { value: haze },
          uLayerOpacity: { value: L.opacity },
          uTime: { value: 0 },
          uWind: { value: 0 },
        },
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
      })
  );
  let layerMeshes = []; // { mesh, geo, bend: InstancedBufferAttribute, plants: [] }
  let atlas = null;

  // ---------- soil
  // premultiplied texture + premultiplied blending (no edge halo), opacity scales all channels
  const soilMat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      uniform float uRepeat;
      varying vec2 vUv;
      void main() {
        vUv = vec2(uv.x * uRepeat, uv.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(uMap, vUv) * uOpacity;
        #include <colorspace_fragment>
      }`,
    uniforms: { uMap: { value: null }, uOpacity: { value: 0 }, uRepeat: { value: 1 } },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const soil = new THREE.Mesh(quad, soilMat);
  soil.renderOrder = 10;
  soil.frustumCulled = false;
  soil.visible = false;
  scene.add(soil);
  let soilInfo = null;
  let soilPlaneH = 220;

  const ready = Promise.all([buildPlantAtlas(renderer.capabilities.maxTextureSize), buildSoilTexture()]).then(([a, s]) => {
    if (disposed) {
      a.texture.dispose();
      s.texture.dispose();
      return;
    }
    atlas = a;
    soilInfo = s;
    plantMats.forEach((m) => (m.uniforms.uAtlas.value = a.texture));
    soilMat.uniforms.uMap.value = s.texture;
    isReady = true;
    layout();
  });

  // ---------- layout (runs on resize and once the atlas is ready)

  function disposeLayers() {
    layerMeshes.forEach(({ mesh, geo }) => {
      plantGroup.remove(mesh);
      mesh.dispose();
      geo.dispose();
    });
    layerMeshes = [];
  }

  function layout() {
    if (!W || !H) return;
    camera.left = 0;
    camera.right = W;
    camera.top = 0;
    camera.bottom = -H;
    camera.updateProjectionMatrix();

    sun.position.set(W / 2, -H / 2, 0);
    sun.scale.set(W, H, 1);
    sunMat.uniforms.uRes.value.set(W, H);
    sunMat.uniforms.uRadius.value = Math.max(W, H) * SUN.radius;

    soilPlaneH = Math.max(220, H * (1 - LAYOUT.soilTop) + 58);
    if (soilInfo) {
      const tileW = soilInfo.width * (soilPlaneH / soilInfo.height); // on-screen width of one tile
      soilMat.uniforms.uRepeat.value = W / tileW;
    }

    if (!isReady) return;
    disposeLayers();
    const base = Math.max(40, Math.round(W / 11));
    const hScale = H / 900;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    LAYERS.forEach((L, li) => {
      const plants = [];
      const n = Math.round(base * L.count * (W > 900 ? 1 : 0.7));
      const cellsForLayer = L.depth === 0 && atlas.blurCells.length ? atlas.blurCells : atlas.cells;
      for (let i = 0; i < n; i++) {
        const x = rnd(-40, W + 40);
        const cx = Math.abs(x - W / 2) / (W / 2);
        if (L.depth > 0 && cx < LAYOUT.centerGap && Math.random() < LAYOUT.centerGapSkip) continue;
        const s = rnd(L.scale[0], L.scale[1]) * hScale;
        const baseY = H * LAYOUT.baseY + rnd(LAYOUT.baseJitter[0], LAYOUT.baseJitter[1]) * H - (2 - L.depth) * LAYOUT.backLift * H;
        let tipMin = H * LAYOUT.tipMinBack;
        if (L.depth > 0) {
          if (x < W * LAYOUT.leftZone) tipMin = H * LAYOUT.tipMinLeft;
          else if (Math.abs(x - W / 2) < W * LAYOUT.centerZone) tipMin = H * LAYOUT.tipMinCenter;
        }
        const h = Math.max(24, Math.min(rnd(LAYOUT.plantHeight[0], LAYOUT.plantHeight[1]) * s, baseY - tipMin));
        const cell = pick(cellsForLayer);
        plants.push({ x, baseY, h, w: h * cell.aspect, cell, flip: Math.random() < 0.5 ? -1 : 1, phase: rnd(0, Math.PI * 2), bend: 0, vel: 0 });
      }

      const count = plants.length;
      const geo = plantBaseGeo.clone();
      const uvRect = new Float32Array(count * 4);
      const flip = new Float32Array(count);
      const tint = new Float32Array(count);
      const phase = new Float32Array(count);
      const bendArr = new Float32Array(count);
      plants.forEach((p, i) => {
        uvRect.set(p.cell.uv, i * 4);
        flip[i] = p.flip;
        tint[i] = L.tint;
        phase[i] = p.phase;
      });
      geo.setAttribute('aUvRect', new THREE.InstancedBufferAttribute(uvRect, 4));
      geo.setAttribute('aFlip', new THREE.InstancedBufferAttribute(flip, 1));
      geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1));
      geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
      const bend = new THREE.InstancedBufferAttribute(bendArr, 1);
      bend.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('aBend', bend);

      const mesh = new THREE.InstancedMesh(geo, plantMats[li], Math.max(1, count));
      mesh.count = count;
      mesh.frustumCulled = false;
      mesh.renderOrder = 1 + li;
      plants.forEach((p, i) => {
        pos.set(p.x, -p.baseY, 0);
        scl.set(p.w, p.h, 1);
        m.compose(pos, quat, scl);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
      plantGroup.add(mesh);
      layerMeshes.push({ mesh, geo, bend, plants, L });
    });
    wind.reset();
  }

  function resize(width, height) {
    W = Math.max(1, Math.round(width));
    H = Math.max(1, Math.round(height));
    renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
    renderer.setSize(W, H, false);
    layout();
  }

  // ---------- per-frame

  /** @param dt seconds since last frame, time seconds, progress 0..2 (already smoothed) */
  function render(dt, time, progress) {
    if (disposed || !W) return;
    const s1 = smooth(progress);
    const s2 = smooth(progress - 1);
    const shift = motion ? TUNING.scrollShift : 0;
    const off = -shift * s1 + 2 * shift * s2; // +down (scene 2), −up (scene 3)
    const windAmt = motion ? Math.max(0, 1 - progress * 1.6) : 0;

    // fixed 60Hz steps so the feel doesn't change with refresh rate
    acc = Math.min(acc + dt, STEP * 4);
    let steps = 0;
    while (acc >= STEP) {
      acc -= STEP;
      steps++;
      wind.update(STEP, W, H, windAmt);
      stepPlants(time, s1, off);
    }
    if (steps) layerMeshes.forEach((l) => (l.bend.needsUpdate = true));

    plantGroup.position.y = -off;

    sunMat.uniforms.uAmount.value = s2;
    sunMat.uniforms.uCenter.value.set(W * SUN.center[0], H * SUN.center[1] + off);
    sun.visible = s2 > 0.001;

    const soilA = s1 * (1 - 0.85 * s2);
    soilMat.uniforms.uOpacity.value = soilA;
    soil.visible = !!soilInfo && soilA > 0.01;
    const soilTopY = H * LAYOUT.soilTop + off - 18;
    soil.position.set(W / 2, -(soilTopY + soilPlaneH / 2), 0);
    soil.scale.set(W, soilPlaneH, 1);

    plantMats.forEach((m) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uWind.value = windAmt;
    });

    renderer.render(scene, camera);
  }

  function stepPlants(time, s1, off) {
    const K = TUNING;
    for (const { plants, bend, L } of layerMeshes) {
      const arr = bend.array;
      for (let i = 0; i < plants.length; i++) {
        const p = plants[i];
        const tipY = p.baseY - p.h + off;
        const w = wind.sample(p.x, tipY, W, H) * L.gain;
        const idle = motion ? Math.sin(time * 1.6 + p.phase + p.x * 0.004) * K.idleSway * (1 - 0.5 * s1) : 0;
        const target = clamp(w * K.maxBend, -K.maxBend, K.maxBend) + idle;
        p.vel += (target - p.bend) * L.lag * 1.4;
        p.vel *= K.springDamp;
        p.bend += p.vel;
        arr[i] = p.bend;
      }
    }
  }

  function dispose() {
    disposed = true;
    canvas.removeEventListener('webglcontextlost', handleLost);
    disposeLayers();
    plantBaseGeo.dispose();
    quad.dispose();
    plantMats.forEach((m) => m.dispose());
    sunMat.dispose();
    soilMat.dispose();
    atlas?.texture.dispose();
    soilInfo?.texture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    ready,
    resize,
    render,
    dispose,
    pointerMove: wind.pointerMove,
    pointerLeave: wind.pointerLeave,
  };
}

function srgbVec(hex) {
  // raw sRGB 0..1 (the sun shader writes them without colour-space conversion)
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
