import { TUNING, WIND_GRID, WIND_CLAMP, WIND_MAX_STAMPS } from './config.js';

/**
 * Cursor-driven wind (docs/09 §4).
 * Two followers (Codrops style): p0 chases the mouse, p1 chases p0 with a smoothed velocity.
 * Each frame the segment p1 → p0 is stamped into a low-res grid of horizontal wind,
 * which then fades with a ~0.28s half-life.
 */
export function createWind() {
  const GX = WIND_GRID.x;
  const GY = WIND_GRID.y;
  const grid = new Float32Array(GX * GY);

  const mouse = { x: -9999, y: -9999, inside: false };
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0, y: 0 };
  const v1 = { x: 0, y: 0 };

  // pointer positions are relative to the stage element
  function pointerMove(x, y, pointerType) {
    if (pointerType === 'touch') return;
    if (!mouse.inside) {
      p0.x = p1.x = x;
      p0.y = p1.y = y;
      v1.x = v1.y = 0;
    }
    mouse.x = x;
    mouse.y = y;
    mouse.inside = true;
  }

  function pointerLeave() {
    mouse.inside = false;
  }

  /** @param dt seconds, W/H stage size, amount 0..1 (scroll + reduced-motion gate) */
  function update(dt, W, H, amount) {
    const K = TUNING;
    p0.x += (mouse.x - p0.x) * K.followMouse;
    p0.y += (mouse.y - p0.y) * K.followMouse;
    const tail = K.followTail * 4;
    v1.x += (p0.x - p1.x - v1.x) * tail;
    v1.y += (p0.y - p1.y - v1.y) * tail;
    p1.x += v1.x * 0.25;
    p1.y += v1.y * 0.25;

    const dx = p0.x - p1.x;
    const dy = p0.y - p1.y;
    const len = Math.hypot(dx, dy);
    const strength = amount * K.windStrength;

    if (mouse.inside && len > 0.5 && strength > 0.01 && W > 0 && H > 0) {
      const steps = Math.min(WIND_MAX_STAMPS, Math.ceil(len / 12));
      const r = K.windRadius * W;
      const gr = Math.max(1.5, (r / W) * GX); // radius in grid cells
      const fx = dx / len;
      const speed = Math.min(1, len / 90);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = ((p1.x + dx * t) / W) * GX;
        const py = ((p1.y + dy * t) / H) * GY;
        const x0 = Math.max(0, Math.floor(px - gr * 2));
        const x1 = Math.min(GX - 1, Math.ceil(px + gr * 2));
        const y0 = Math.max(0, Math.floor(py - gr * 2));
        const y1 = Math.min(GY - 1, Math.ceil(py + gr * 2));
        for (let gy = y0; gy <= y1; gy++) {
          for (let gx = x0; gx <= x1; gx++) {
            const d2 = ((gx - px) ** 2 + (gy - py) ** 2) / (gr * gr);
            grid[gy * GX + gx] += fx * Math.exp(-d2) * speed * 0.35 * strength * (6 / steps);
          }
        }
      }
    }

    const keep = Math.pow(0.5, dt / K.windHalfLife);
    for (let i = 0; i < grid.length; i++) {
      const v = grid[i] * keep;
      grid[i] = v > WIND_CLAMP ? WIND_CLAMP : v < -WIND_CLAMP ? -WIND_CLAMP : v;
    }
  }

  function sample(x, y, W, H) {
    const gx = Math.max(0, Math.min(GX - 1, Math.round((x / W) * GX)));
    const gy = Math.max(0, Math.min(GY - 1, Math.round((y / H) * GY)));
    return grid[gy * GX + gx];
  }

  function reset() {
    grid.fill(0);
  }

  return { pointerMove, pointerLeave, update, sample, reset };
}
