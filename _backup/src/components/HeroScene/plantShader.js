// Plant layer shaders (docs/09 §3-1).
// Geometry: PlaneGeometry(1, 1, 1, 16) moved so the origin is the base (bottom centre).
// instanceMatrix carries position + size; bending happens here in unit space.
// The atlas texture is uploaded with premultiplied alpha, and the material blends as premultiplied,
// so filtered/mipmapped edges don't get a white halo.

export const plantVertexShader = /* glsl */ `
  attribute vec4 aUvRect;   // x, y, w, h of this plant's cell in the atlas
  attribute float aBend;    // radians, updated every frame on the CPU
  attribute float aFlip;    // ±1 horizontal mirror
  attribute float aTint;    // 0..1 mix toward the haze colour (back layers)
  attribute float aPhase;

  uniform float uTime;
  uniform float uWind;      // 0..1, leaf flutter amount

  varying vec2 vUv;
  varying float vTint;

  void main() {
    float t = uv.y;                 // 0 = base, 1 = tip
    float k = pow(t, 1.6);          // bend grows toward the tip

    // geometry is unit-sized; convert a height-relative offset into this instance's width units
    float w = length(instanceMatrix[0].xyz);
    float h = length(instanceMatrix[1].xyz);
    float hw = h / max(w, 0.0001);

    vec3 p = position;
    float sb = sin(aBend);
    p.x += sb * k * 0.9 * hw;
    p.y *= 1.0 - 0.18 * abs(sb) * k;
    p.x += sin(uTime * 6.0 + t * 8.0 + aPhase) * 0.004 * k * uWind * hw;

    float u = aFlip > 0.0 ? uv.x : 1.0 - uv.x;
    vUv = vec2(aUvRect.x + u * aUvRect.z, aUvRect.y + uv.y * aUvRect.w);
    vTint = aTint;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
  }
`;

export const plantFragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uHazeColor;
  uniform float uLayerOpacity;

  varying vec2 vUv;
  varying float vTint;

  void main() {
    vec4 c = texture2D(uAtlas, vUv);   // premultiplied
    if (c.a < 0.02) discard;
    c.rgb = mix(c.rgb, uHazeColor * c.a, vTint);
    gl_FragColor = c * uLayerOpacity;
    #include <colorspace_fragment>
  }
`;

// Full-screen sunlight (docs/09 §5): warm radial glow from the top right, faint rays,
// and the background brightening toward #FBFCF4. Colours are authored in sRGB and written
// straight out (no colour-space conversion), premultiplied.
export const sunVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sunFragmentShader = /* glsl */ `
  uniform vec2 uRes;          // stage size in px
  uniform vec2 uCenter;       // px, top-left origin
  uniform float uRadius;      // px
  uniform float uAmount;      // s2
  uniform vec3 uTint;
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform vec3 uRay;

  varying vec2 vUv;

  // premultiplied "over"
  vec4 over(vec4 dst, vec3 rgb, float a) {
    return vec4(rgb * a + dst.rgb * (1.0 - a), a + dst.a * (1.0 - a));
  }

  void main() {
    vec2 px = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);
    vec4 col = vec4(0.0);

    // background brightens
    col = over(col, uTint, uAmount);

    // radial glow: core (.85) → mid (.32) at 35% → transparent
    float d = clamp(length(px - uCenter) / uRadius, 0.0, 1.0);
    vec3 g;
    float ga;
    if (d < 0.35) {
      float k = d / 0.35;
      g = mix(uCore, uMid, k);
      ga = mix(0.85, 0.32, k);
    } else {
      float k = (d - 0.35) / 0.65;
      g = uMid;
      ga = mix(0.32, 0.0, k);
    }
    col = over(col, g, ga * uAmount);

    // faint rays fanning down-left
    vec2 v = px - uCenter;
    float ang = atan(v.y, -v.x);            // 0 = pointing left, + = downward
    float fan = smoothstep(0.35, 0.6, ang) * (1.0 - smoothstep(1.15, 1.45, ang));
    float rays = pow(0.5 + 0.5 * sin(ang * 34.0), 6.0) * 0.6 + pow(0.5 + 0.5 * sin(ang * 13.0 + 1.3), 8.0) * 0.4;
    float fall = 1.0 - smoothstep(0.1, 1.25, length(v) / uRadius);
    col = over(col, uRay, rays * fan * fall * 0.16 * uAmount);

    gl_FragColor = col;
  }
`;
