import * as THREE from 'three';
import { COLORS } from './config.js';

// Drop real images into src/assets/hero/ and they are picked up at build time — no code change:
//   plants/plant-01-monstera.webp … plant-12-*.webp   (transparent, base at bottom centre)
//   plants/plant-XX-*-blur.webp                        (optional, used by the back layer)
//   soil.webp, hero-fallback.webp
// Until then, plants and soil are painted on a canvas so the scene works with the same structure.
const plantFiles = import.meta.glob('../../assets/hero/plants/*.webp', { eager: true, query: '?url', import: 'default' });
const soilFiles = import.meta.glob('../../assets/hero/soil.webp', { eager: true, query: '?url', import: 'default' });
const fallbackFiles = import.meta.glob('../../assets/hero/hero-fallback.webp', { eager: true, query: '?url', import: 'default' });

export const fallbackImageUrl = Object.values(fallbackFiles)[0] || null;

const PAD = 8; // transparent gutter around each cell so mipmaps don't bleed between plants

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

function makeTexture(canvas, { premultiply }) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = premultiply;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Builds the plant atlas.
 * @returns {Promise<{ texture, cells: {uv:number[], aspect:number}[], blurCells: same[] }>}
 *   uv = [x, y, w, h] in texture space (y from the bottom), aspect = width / height of the plant.
 */
export async function buildPlantAtlas(maxTextureSize) {
  const entries = Object.entries(plantFiles).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return buildPlaceholderAtlas();

  const images = await Promise.all(entries.map(([path, url]) => loadImage(url).then((img) => ({ path, img }))));
  const size = Math.min(4096, maxTextureSize || 4096);
  const cols = 4;
  const rows = Math.ceil(images.length / cols);
  const cw = Math.floor(size / cols);
  const ch = Math.floor(size / rows);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cells = [];
  const blurCells = [];

  images.forEach(({ path, img }, i) => {
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    const s = Math.min((cw - PAD * 2) / img.width, (ch - PAD * 2) / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    const dx = cx + (cw - dw) / 2;
    const dy = cy + ch - PAD - dh; // base sits on the bottom of the cell
    ctx.drawImage(img, dx, dy, dw, dh);
    const cell = { uv: [dx / size, 1 - (dy + dh) / size, dw / size, dh / size], aspect: dw / dh };
    (/-blur\.webp$/.test(path) ? blurCells : cells).push(cell);
  });

  return { texture: makeTexture(canvas, { premultiply: true }), cells, blurCells };
}

// ---------- placeholder plants (shapes from docs/reference/hero-demo.html, unbent)

const KINDS = ['fern', 'broad', 'grass', 'round', 'tall'];

function leaf(ctx, len, wid) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wid * 0.9, -len * 0.25, wid * 0.7, -len * 0.8, 0, -len);
  ctx.bezierCurveTo(-wid * 0.7, -len * 0.8, -wid * 0.9, -len * 0.25, 0, 0);
  ctx.fill();
}

function drawPlaceholderPlant(ctx, kind, x, baseY, h, s, col, col2, seed) {
  const pt = (t) => ({ x, y: baseY - h * t });
  const tip = pt(1);
  if (kind === 'grass') {
    ctx.fillStyle = col;
    for (let j = 0; j < 6; j++) {
      ctx.save();
      ctx.translate(x + (j - 2.5) * 7 * s, baseY);
      ctx.rotate((j - 2.5) * 0.12);
      leaf(ctx, h * (0.55 + ((j * 37 + seed) % 10) / 25), 7 * s);
      ctx.restore();
    }
    return;
  }
  ctx.strokeStyle = col2;
  ctx.lineWidth = Math.max(1.5, 3 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.fillStyle = col;
  if (kind === 'fern') {
    for (let t = 0.25; t < 0.98; t += 0.075) {
      const q = pt(t);
      const L = (1 - t) * 48 * s + 10 * s;
      for (const sd of [-1, 1]) {
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(sd * 1.15);
        leaf(ctx, L, L * 0.32);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(tip.x, tip.y);
    leaf(ctx, 18 * s, 6 * s);
    ctx.restore();
  } else if (kind === 'broad') {
    for (let j = 0; j < 3; j++) {
      const q = pt(0.55 + j * 0.2);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate((j % 2 ? 1 : -1) * 0.75);
      leaf(ctx, 70 * s, 36 * s);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(tip.x, tip.y);
    leaf(ctx, 80 * s, 40 * s);
    ctx.restore();
  } else if (kind === 'round') {
    const n = 5 + (seed % 4);
    for (let j = 0; j < n; j++) {
      const t = 0.35 + (j / n) * 0.65;
      const q = pt(t);
      const sd = j % 2 ? 1 : -1;
      const r = (14 + (1 - t) * 10) * s;
      ctx.beginPath();
      ctx.ellipse(q.x + sd * r * 0.9, q.y, r, r * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let j = 0; j < 3; j++) {
      ctx.save();
      ctx.translate(x + (j - 1) * 8 * s, baseY);
      ctx.rotate((j - 1) * 0.16);
      leaf(ctx, h * (0.75 + j * 0.12), 15 * s);
      ctx.restore();
    }
  }
}

function buildPlaceholderAtlas() {
  const size = 2048;
  const cols = 4;
  const rows = 3;
  const cw = size / cols;
  const ch = Math.floor(size / rows);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const fills = [COLORS.deep, COLORS.mid, COLORS.fresh, COLORS.lime, COLORS.soft];
  const stems = [COLORS.deep, COLORS.mid, COLORS.fresh];
  const cells = [];

  for (let i = 0; i < cols * rows; i++) {
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + PAD, cy + PAD, cw - PAD * 2, ch - PAD * 2);
    ctx.clip();
    const h = (ch - PAD * 2) * 0.9;
    const s = h / 260;
    drawPlaceholderPlant(ctx, KINDS[i % KINDS.length], cx + cw / 2, cy + ch - PAD, h, s, fills[(i * 3) % fills.length], stems[i % stems.length], i * 7);
    ctx.restore();
    cells.push({ uv: [cx / size, 1 - (cy + ch) / size, cw / size, ch / size], aspect: cw / ch });
  }

  return { texture: makeTexture(canvas, { premultiply: true }), cells, blurCells: [] };
}

// ---------- soil

/** @returns {Promise<{ texture, width, height }>} horizontally tileable soil strip */
export async function buildSoilTexture() {
  const url = Object.values(soilFiles)[0];
  let canvasOrImage;
  if (url) {
    canvasOrImage = await loadImage(url);
  } else {
    canvasOrImage = paintPlaceholderSoil();
  }
  const tex =
    canvasOrImage instanceof HTMLCanvasElement ? new THREE.CanvasTexture(canvasOrImage) : new THREE.Texture(canvasOrImage);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return { texture: tex, width: canvasOrImage.width, height: canvasOrImage.height };
}

// Tileable: every wave uses a whole number of periods across the width, and pebbles/roots wrap.
function paintPlaceholderSoil() {
  const W = 2048;
  const H = 512;
  const sy = H / 220; // texture px per screen px (plane is ≈ 220px tall at 900px viewport)
  const top = 18 * sy;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const wave = (x, a1, n1, a2, n2, ph = 0) =>
    Math.sin((x / W) * Math.PI * 2 * n1 + ph) * a1 + Math.sin((x / W) * Math.PI * 2 * n2 + ph * 2) * a2;

  ctx.fillStyle = COLORS.soil;
  ctx.beginPath();
  ctx.moveTo(0, top + wave(0, 8 * sy, 4, 4 * sy, 13));
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, top + wave(x, 8 * sy, 4, 4 * sy, 13));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = COLORS.soilDeep;
  ctx.beginPath();
  const deep = top + 70 * sy;
  ctx.moveTo(0, deep + wave(0, 10 * sy, 3, 0, 1, 1));
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, deep + wave(x, 10 * sy, 3, 0, 1, 1));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // roots
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = COLORS.soilDeep;
  ctx.lineWidth = 2.5 * sy;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const rx = ((i + 0.4) / 6) * W;
    for (const ox of [-W, 0, W]) {
      const x = rx + ox;
      const t = top + 4 * sy;
      ctx.beginPath();
      ctx.moveTo(x, t);
      ctx.quadraticCurveTo(x - 14 * sy, t + 40 * sy, x - 22 * sy, t + 72 * sy);
      ctx.moveTo(x, t);
      ctx.quadraticCurveTo(x + 10 * sy, t + 44 * sy, x + 26 * sy, t + 66 * sy);
      ctx.moveTo(x, t);
      ctx.lineTo(x + 2 * sy, t + 80 * sy);
      ctx.stroke();
    }
  }

  // pebbles
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = COLORS.pebble;
  for (let i = 0; i < 46; i++) {
    const x = (i * 97.3 * sy) % W;
    const y = top + 20 * sy + ((i * 53) % 90) * sy;
    for (const ox of [-W, 0, W]) {
      ctx.beginPath();
      ctx.ellipse(x + ox, y, 3 * sy, 2.2 * sy, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return canvas;
}
