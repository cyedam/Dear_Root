// Tunable values for the P1 hero scene (docs/09-codex-hero-task.md §6).
// `TUNING` is mutable on purpose: the ?debug panel edits it live.

export const TUNING = {
  followMouse: 0.12, // p0 → mouse
  followTail: 0.05, // v1 smoothing (×4 in code)
  windRadius: 0.08, // × screen width
  windStrength: 1,
  windHalfLife: 0.28, // seconds
  maxBend: 0.32, // rad (≈18°)
  idleSway: 0.025, // rad
  springDamp: 0.78,
  scrollShift: 26, // px
};

export const DEFAULT_TUNING = { ...TUNING };

// Back → front. counts are fractions of `max(40, W / 11)` (≈ 70 / 100 / 70 at 1440px).
export const LAYERS = [
  { name: 'back', depth: 0, count: 0.55, scale: [0.55, 0.85], opacity: 0.55, gain: 0.4, lag: 0.06, tint: 0.35 },
  { name: 'mid', depth: 1, count: 0.75, scale: [0.8, 1.1], opacity: 0.85, gain: 0.7, lag: 0.09, tint: 0.15 },
  { name: 'front', depth: 2, count: 0.55, scale: [1.05, 1.5], opacity: 1, gain: 1.0, lag: 0.12, tint: 0 },
];

export const WIND_GRID = { x: 64, y: 40 };
export const WIND_CLAMP = 1.6;
export const WIND_MAX_STAMPS = 24;

export const LAYOUT = {
  baseY: 0.86, // plant base, × H
  baseJitter: [-0.06, 0.05],
  backLift: 0.03, // each layer further back sits this much (× H) higher
  plantHeight: [170, 330], // px at H = 900, before layer scale
  // keep copy readable: highest point a plant tip may reach (× H)
  tipMinLeft: 0.6, // mid/front, x < 38% of W
  tipMinCenter: 0.48, // mid/front, |x − W/2| < 30% of W
  tipMinBack: 0.3,
  leftZone: 0.38,
  centerZone: 0.3,
  centerGap: 0.28, // mid/front: skip 70% of plants within this central band
  centerGapSkip: 0.7,
  soilTop: 0.83, // × H
};

export const SUN = {
  center: [0.82, -0.05], // × W, × H
  radius: 0.85, // × max(W, H)
};

export const COLORS = {
  hero: '#EAF3DC',
  sunTint: '#FBFCF4',
  sunCore: '#FFF0AA',
  sunMid: '#F4D76B',
  ray: '#FFF6C8',
  // placeholder plant + soil palette (from the demo / design tokens)
  deep: '#2E7D4F',
  mid: '#4C9B6A',
  fresh: '#8CC56E',
  lime: '#C6E07A',
  soft: '#B9D89A',
  soil: '#CDB394',
  soilDeep: '#9C7F5E',
  pebble: '#F7F5EE',
};

export const MAX_DPR = 2;
export const SCROLL_FOLLOW = 0.12;
