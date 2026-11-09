/**
 * particle-globe: land drawn as glowing dots, particles lifting off the land,
 * arcs between places, and a morph to a flat Mercator map. Plain WebGL, no
 * dependencies.
 *
 *   const globe = createParticleGlobe(element, { colors: ["#fff", "#aaa", "#555"] })
 *   globe.update({ flat: 1 })   // animate to the flat map
 *   globe.destroy()
 *
 * The element is the stage: the globe fills it and keeps its own canvas and
 * label layer inside it. Give it a size; a square works best.
 */
import { LAND_DATA, LAND_H, LAND_W } from "./land-mask"

export type LatLon = [number, number]

export interface ArcRoute {
  from: LatLon
  to: LatLon
  /** Small label shown at the destination while the arc is drawn. */
  label?: string
}

export interface GlobeOptions {
  /** Dot gradient: start, middle and end colours (any CSS colour). */
  colors: [string, string, string]
  /** Direction of the gradient across the screen, in degrees. */
  gradientAngle: number
  /** Where the middle colour sits along the gradient, 0.1 to 0.9. */
  gradientMid: number
  dots: {
    /** Overall brightness, 0 to 2. */
    intensity: number
    /** Dot size, 0.2 to 4. */
    size: number
    /** How much dots vary in size, 0 to 2.5. */
    sizeVariation: number
    /** Share of the land dots drawn, 0.05 to 1. */
    density: number
    /** Twinkle amount, 0 (off) to 1. */
    twinkle: number
    /** Highlight fade across the face, 0 (off) to 1. */
    highlight: number
    /** Dots on the far side, 0 (hidden) to 1. */
    farSide: number
  }
  /** Particles lifting off the land. `false` turns them off. */
  particles:
    | false
    | {
        /** Share of particles shown, 0.02 to 1. */
        amount: number
        size: number
        /** How far they rise, 0.02 to 0.5. */
        rise: number
        /** Upward drift, 0 to 0.4. */
        drift: number
        /** Rise speed, 0.03 to 1. */
        speed: number
        opacity: number
      }
  /** Glow around the globe. Off by default; `false` turns it off. */
  atmosphere:
    | false
    | {
        color: string
        /** 0 to 1. */
        strength: number
        /** Glow size relative to the globe, 1.02 to 1.5. */
        size: number
      }
  /** Edge highlight on the globe body. */
  rim: { color: string; strength: number }
  /** The sphere under the dots. */
  globe: { fill: string; fillOpacity: number }
  /** Stage background colour, or "transparent". */
  background: string
  /** Arcs between places. `false` turns them off. */
  arcs:
    | false
    | {
        routes: ArcRoute[]
        /** Start and end colour of each arc. */
        colors: [string, string]
        opacity: number
        /** Tube thickness, 0.001 to 0.012. */
        thickness: number
        /** Arc height relative to the distance travelled, 0.1 to 1. */
        height: number
        /** Animation speed multiplier. */
        speed: number
        /** Rings at each end. */
        rings: boolean
        /** Size multiplier for the endpoint rings. 1 is the default size. */
        ringSize: number
        /** Show route labels at the destination. */
        labels: boolean
      }
  rotation: {
    auto: boolean
    /** Radians per second. */
    speed: number
    /** 1 spins left to right, -1 right to left. */
    direction: 1 | -1
    /** Longitude facing the viewer on the globe, -180 to 180. */
    startLongitude: number
    /** View from above (positive) or below (negative), -1 to 1. */
    tilt: number
  }
  /** 0 is the globe, 1 is a flat Mercator map; anything between morphs. */
  flat: number
  /** Longitude at the centre of the flat map, -180 to 180. The map wraps at the opposite side. */
  flatCentre: number
  /** How long a change to `flat` animates, in milliseconds. 0 jumps. */
  flatTransition: number
  /** Drag to spin. */
  draggable: boolean
  /** Pause rendering while the stage is off screen. */
  pauseOffscreen: boolean
  /** Hold still for people who ask for reduced motion. */
  respectReducedMotion: boolean
  /** Upper bound for the canvas pixel ratio. */
  maxPixelRatio: number
  /** Called once the first frame is on screen. */
  onReady?: () => void
}

type Group<T> = false | Partial<Exclude<T, false>>

/** Anything you pass is merged over the defaults; groups take partial objects. */
export type GlobeInput = Partial<
  Omit<GlobeOptions, "dots" | "rotation" | "rim" | "globe" | "particles" | "atmosphere" | "arcs">
> & {
  dots?: Partial<GlobeOptions["dots"]>
  rotation?: Partial<GlobeOptions["rotation"]>
  rim?: Partial<GlobeOptions["rim"]>
  globe?: Partial<GlobeOptions["globe"]>
  particles?: Group<GlobeOptions["particles"]>
  atmosphere?: Group<GlobeOptions["atmosphere"]>
  arcs?: Group<GlobeOptions["arcs"]>
}

export interface ParticleGlobe {
  /** Change any options; only what you pass changes. */
  update(input: GlobeInput): void
  /** The options in effect now. */
  readonly options: GlobeOptions
  /** Re-measure the stage (it also does this on its own when the stage resizes). */
  resize(): void
  /** Stop, free the GPU resources and remove the canvas. */
  destroy(): void
}

export const DEFAULT_ROUTES: ArcRoute[] = [
  { from: [37.77, -122.42], to: [-23.55, -46.63] },
  { from: [51.5, -0.12], to: [43.65, -79.38] },
  { from: [19.43, -99.13], to: [40.42, -3.7] },
  { from: [40.71, -74.0], to: [6.52, 3.38] },
  { from: [25.76, -80.19], to: [-34.6, -58.38] },
  { from: [41.88, -87.63], to: [38.72, -9.14] },
  { from: [4.71, -74.07], to: [48.86, 2.35] },
  { from: [53.35, -6.26], to: [40.71, -74.0] },
  { from: [-12.05, -77.04], to: [25.76, -80.19] },
  { from: [-23.55, -46.63], to: [51.5, -0.12] },
  { from: [1.35, 103.82], to: [-33.87, 151.21] },
  { from: [35.68, 139.69], to: [37.77, -122.42] },
  { from: [25.2, 55.27], to: [19.08, 72.88] },
  { from: [50.11, 8.68], to: [1.35, 103.82] },
  { from: [-36.85, 174.76], to: [13.76, 100.5] },
  { from: [22.32, 114.17], to: [51.5, -0.12] },
  { from: [-26.2, 28.05], to: [-1.29, 36.82] },
  { from: [37.57, 126.98], to: [-6.2, 106.85] },
  { from: [41.01, 28.98], to: [25.2, 55.27] },
  { from: [-33.87, 151.21], to: [-36.85, 174.76] },
]

export const DEFAULT_OPTIONS: GlobeOptions = {
  colors: ["#6b54f5", "#db61db", "#eb4d54"],
  gradientAngle: 57,
  gradientMid: 0.55,
  dots: { intensity: 1, size: 1, sizeVariation: 1, density: 0.55, twinkle: 0.28, highlight: 0.78, farSide: 0 },
  particles: { amount: 0.4, size: 0.9, rise: 0.14, drift: 0.06, speed: 0.22, opacity: 0.6 },
  atmosphere: false,
  rim: { color: "#edebff", strength: 1 },
  globe: { fill: "#ffffff", fillOpacity: 0.96 },
  background: "transparent",
  arcs: {
    routes: DEFAULT_ROUTES,
    colors: ["#f25c85", "#fa8c5c"],
    opacity: 0.95,
    thickness: 0.0042,
    height: 0.42,
    speed: 1,
    rings: true,
    ringSize: 1,
    labels: false,
  },
  rotation: { auto: true, speed: 0.035, direction: 1, startLongitude: -55, tilt: 0.32 },
  flat: 0,
  flatCentre: 10,
  flatTransition: 1200,
  draggable: true,
  pauseOffscreen: true,
  respectReducedMotion: true,
  maxPixelRatio: 2,
}

/** Defaults used when a group switched off with `false` is switched back on. */
const GROUP_DEFAULTS = {
  particles: DEFAULT_OPTIONS.particles as Exclude<GlobeOptions["particles"], false>,
  atmosphere: { color: "#9e94ff", strength: 0.16, size: 1.12 },
  arcs: DEFAULT_OPTIONS.arcs as Exclude<GlobeOptions["arcs"], false>,
}

function merge(base: GlobeOptions, input: GlobeInput): GlobeOptions {
  const out = { ...base, ...(input as Partial<GlobeOptions>) } as GlobeOptions
  out.dots = { ...base.dots, ...input.dots }
  out.rotation = { ...base.rotation, ...input.rotation }
  out.rim = { ...base.rim, ...input.rim }
  out.globe = { ...base.globe, ...input.globe }
  for (const k of ["particles", "atmosphere", "arcs"] as const) {
    const v = (input as unknown as Record<string, unknown>)[k]
    if (v === undefined) continue
    ;(out as unknown as Record<string, unknown>)[k] = v === false ? false : { ...(base[k] || GROUP_DEFAULTS[k]), ...(v as object) }
  }
  return out
}

// ---------- small maths ----------
type M4 = Float32Array
const DEG = Math.PI / 180
const R = 1
const ident = (): M4 => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
function mul(a: M4, b: M4): M4 {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
  return o
}
function rot(axis: "x" | "y" | "z", t: number): M4 {
  const c = Math.cos(t)
  const s = Math.sin(t)
  const m = ident()
  if (axis === "x") (m[5] = c), (m[6] = s), (m[9] = -s), (m[10] = c)
  else if (axis === "y") (m[0] = c), (m[2] = -s), (m[8] = s), (m[10] = c)
  else (m[0] = c), (m[1] = s), (m[4] = -s), (m[5] = c)
  return m
}
function scale(k: number): M4 {
  const m = ident()
  m[0] = m[5] = m[10] = k
  return m
}
function perspective(fovy: number, aspect: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(fovy / 2)
  const m = new Float32Array(16)
  m[0] = f / aspect
  m[5] = f
  m[10] = (far + near) / (near - far)
  m[11] = -1
  m[14] = (2 * far * near) / (near - far)
  return m
}
const normal3 = (m: M4) => new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]])
const apply4 = (m: M4, x: number, y: number, z: number) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
  m[3] * x + m[7] * y + m[11] * z + m[15],
]

/** Lat/lon to a point on the sphere (same convention as three.js globes). */
function ll2v(lat: number, lon: number, r = R): [number, number, number] {
  const phi = (90 - lat) * DEG
  const th = (lon + 180) * DEG
  return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)]
}

// Flat map: Mercator, clipped at ±80°, sized to sit where the globe does.
const MAX_LAT = 80
const FLAT_W = 2.36
const FLAT_K = FLAT_W / (2 * Math.PI)
function flatXY(lat: number, lon: number, centre: number): [number, number] {
  let d = lon - centre
  d = ((((d + 180) % 360) + 360) % 360) - 180
  const la = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * DEG
  return [d * DEG * FLAT_K, Math.log(Math.tan(Math.PI / 4 + la / 2)) * FLAT_K]
}

// ---------- land ----------
let landGrid: Uint8Array | null = null
// Cells are padded by 2 on the left, right and top so the decoder can look around without bounds checks.
const LAND_S = LAND_W + 4
function landMask() {
  if (landGrid) return landGrid
  // Adaptive binary range decoder; the model mirrors scripts/build-land.mjs.
  const raw = atob(LAND_DATA)
  const g = new Uint8Array(LAND_S * (LAND_H + 2))
  const p = new Float64Array(128).fill(0.5)
  const seen = new Float64Array(128)
  let range = 0xffffffff
  let code = 0
  let i = 0
  for (; i < 4; ) code = code * 256 + raw.charCodeAt(i++)
  for (let y = 0; y < LAND_H; y++)
    for (let x = 0; x < LAND_W; x++) {
      const j = (y + 2) * LAND_S + x + 2
      let c = 0
      for (const k of [1, 2, LAND_S + 1, LAND_S, LAND_S - 1, LAND_S - 2, 2 * LAND_S]) c = c * 2 + g[j - k]
      const bound = (range >>> 15) * (((1 - p[c]) * 32766 + 1) | 0)
      let b = 0
      if (code < bound) range = bound
      else (code -= bound), (range -= bound), (b = 1)
      while (range < 2 ** 24) (range *= 256), (code = code * 256 + (raw.charCodeAt(i++) || 0))
      p[c] += (b - p[c]) / (seen[c] + 2)
      if (seen[c] < 1000) seen[c]++
      g[j] = b
    }
  landGrid = g
  return g
}
const isLand = (g: Uint8Array, lat: number, lon: number) => {
  const r = Math.min(LAND_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LAND_H)))
  const c = Math.min(LAND_W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * LAND_W)))
  return g[(r + 2) * LAND_S + c + 2] === 1
}
/** Evenly spread points (golden spiral), kept where there is land. */
function landPoints(candidates: number) {
  const g = landMask()
  const out: number[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < candidates; i++) {
    const y = 1 - (2 * (i + 0.5)) / candidates
    const lat = Math.asin(y) / DEG + (Math.random() - 0.5) * 0.5
    let lon = ((i * golden) / DEG) % 360
    lon = lon - 180 + (Math.random() - 0.5) * 0.5
    if (isLand(g, lat, lon)) out.push(lat, lon)
  }
  return out
}

// ---------- shaders ----------
const PREC = "precision highp float;\n"
const MORPH = `
  uniform float uMorph, uCentre, uFlatK;
  uniform mat4 viewMatrix;
  vec3 flatPos(vec2 ll, float lift){
    float d = mod(ll.y - uCentre + 180.0, 360.0) - 180.0;
    float la = clamp(ll.x, -80.0, 80.0) * 0.0174533;
    return vec3(d * 0.0174533 * uFlatK, log(tan(0.785398 + la * 0.5)) * uFlatK + lift, 0.0);
  }`
const DOT_FRAG =
  PREC +
  `
  uniform vec3 uC1, uC2, uC3; uniform float uAngle, uMid;
  varying float vA; varying vec2 vScreen; varying float vSeed;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25 || vA < 0.01) discard;
    float t = clamp(0.5 + 0.48 * dot(vScreen, vec2(cos(uAngle), sin(uAngle))), 0.0, 1.0);
    vec3 col = t < uMid ? mix(uC1, uC2, t / uMid) : mix(uC2, uC3, (t - uMid) / (1.0 - uMid));
    col = mix(col, vec3(1.0), 0.08 * vSeed);
    gl_FragColor = vec4(col, clamp(vA, 0.0, 1.0));
  }`
const MESH_VERT = `
  attribute vec3 position; attribute vec3 normal;
  uniform mat4 modelViewMatrix, projectionMatrix; uniform mat3 normalMatrix;
  varying vec3 vN;
  void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const BODY_FRAG =
  PREC +
  `uniform vec3 uFill; uniform vec3 uLimb; uniform float uOp; uniform float uLimbStr; uniform float uFade; varying vec3 vN;
  void main(){ float f = pow(1.0 - max(vN.z,0.0), 3.0); vec3 c = mix(uFill, uLimb, f * uLimbStr);
    gl_FragColor = vec4(c, max(uOp, f * uLimbStr * 0.9) * uFade); }`
const HALO_FRAG =
  PREC +
  `uniform vec3 uColor; uniform float uStr; varying vec3 vN;
  void main(){ float i = pow(clamp(0.62 - dot(vN, vec3(0.0,0.0,-1.0)), 0.0, 1.0), 3.0) * 3.0; gl_FragColor = vec4(uColor, clamp(i,0.0,1.0) * uStr); }`
const DOT_VERT =
  `
  attribute vec3 position; attribute vec2 aLL; attribute float aSeed; attribute float aSize; attribute float aKeep;
  uniform mat4 modelViewMatrix, projectionMatrix; uniform mat3 normalMatrix;
  uniform float uTime, uPx, uSize, uDensity, uTwinkle, uHl, uIntensity, uBack, uVar; uniform vec2 uHlPos;
  varying float vA; varying vec2 vScreen; varying float vSeed;` +
  MORPH +
  `
  void main(){
    if (aKeep > uDensity) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
    vec4 mv = mix(modelViewMatrix * vec4(position, 1.0), viewMatrix * vec4(flatPos(aLL, 0.0), 1.0), uMorph);
    vec3 n = normalize(normalMatrix * position);
    n.z = mix(n.z, 1.0, uMorph);
    vec2 nxy = mix(n.xy, mv.xy * 0.6, uMorph);
    float light = smoothstep(0.12, 0.95, length(nxy - uHlPos));
    float shade = mix(1.0 - uHl, 1.0, light);
    float tw = 1.0 - uTwinkle + uTwinkle * (0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 40.0));
    float front = smoothstep(0.0, 0.18, n.z);
    float back = (1.0 - smoothstep(-0.06, 0.0, n.z)) * uBack * 0.4;
    vA = (front * shade + back) * tw * uIntensity;
    vA *= 1.0 - smoothstep(72.0, 79.0, abs(aLL.x)) * uMorph;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
    vScreen = gl_Position.xy / gl_Position.w;
    float s = max(0.08, 0.72 + (aSize - 0.72) * uVar);
    gl_PointSize = s * uSize * uPx * (5.0 / -mv.z) * 1.15 * (n.z < 0.0 ? 0.8 : 1.0);
  }`
const FLOAT_VERT =
  `
  attribute vec3 position; attribute vec2 aLL; attribute float aSeed; attribute float aSize; attribute float aKeep; attribute float aPhase;
  uniform mat4 modelViewMatrix, projectionMatrix; uniform mat3 normalMatrix;
  uniform float uTime, uPx, uSize, uAmt, uH, uSpeed, uDrift, uOp, uVar;
  varying float vA; varying vec2 vScreen; varying float vSeed;` +
  MORPH +
  `
  void main(){
    if (aKeep > uAmt) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
    float life = fract(uTime * uSpeed * (0.6 + aSeed * 0.8) + aPhase);
    vec3 p = position * (1.0 + life * uH * (0.5 + aSeed));
    vec4 sph = modelViewMatrix * vec4(p, 1.0);
    sph.y += life * uDrift;
    vec4 fl = viewMatrix * vec4(flatPos(aLL, life * (uH * (0.5 + aSeed) + uDrift) * 0.5), 1.0);
    vec4 mv = mix(sph, fl, uMorph);
    vec3 n = normalize(normalMatrix * position);
    float facing = mix(smoothstep(-0.35, 0.1, n.z), 1.0, uMorph);
    vA = sin(3.14159 * life) * facing * uOp;
    vA *= 1.0 - smoothstep(72.0, 79.0, abs(aLL.x)) * uMorph;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
    vScreen = gl_Position.xy / gl_Position.w;
    float s = max(0.08, 0.8 + (aSize - 0.8) * uVar);
    gl_PointSize = s * uSize * uPx * (5.0 / -mv.z) * 1.1 * (1.0 - 0.35 * life);
  }`
const ARC_VERT = `
  attribute vec3 position; attribute vec3 aFlat; attribute float aT;
  uniform mat4 modelViewMatrix, projectionMatrix, viewMatrix; uniform float uMorph, uShift;
  varying float vT, vX;
  void main(){ vT = aT; vX = aFlat.x + uShift; vec4 mv = mix(modelViewMatrix*vec4(position,1.0), viewMatrix*vec4(vX,aFlat.yz,1.0), uMorph); gl_Position = projectionMatrix*mv; }`
const ARC_FRAG =
  PREC + `uniform vec3 uA; uniform vec3 uB; uniform float uOp, uStart, uEnd, uFeather, uMorph, uEdge; varying float vT, vX;
  void main(){ float a = smoothstep(uStart - uFeather, uStart, vT) * (1.0 - smoothstep(uEnd, uEnd + uFeather, vT));
    a *= mix(1.0, 1.0 - smoothstep(uEdge - 0.012, uEdge, abs(vX)), uMorph);
    if (a < 0.004) discard; gl_FragColor = vec4(mix(uA, uB, vT), uOp * a); }`
const RING_VERT =
  `
  attribute vec3 position; attribute vec2 aLL; attribute float aS; attribute float aO;
  uniform mat4 modelViewMatrix, projectionMatrix; uniform mat3 normalMatrix; uniform float uPx;
  varying float vO;` +
  MORPH +
  `
  void main(){ vO = aO; vec3 n = normalize(normalMatrix*position); vO *= mix(smoothstep(0.0,0.2,n.z), 1.0, uMorph);
    vec4 mv = mix(modelViewMatrix*vec4(position,1.0), viewMatrix*vec4(flatPos(aLL, 0.0), 1.0), uMorph);
    gl_Position = projectionMatrix*mv; gl_PointSize = aS * uPx * 26.0; }`
const RING_FRAG =
  PREC +
  `uniform vec3 uColor; varying float vO;
  void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard;
    float glow = (1.0 - smoothstep(0.35, 1.0, r)) * 0.35;
    float ring = smoothstep(0.30, 0.36, r) * (1.0 - smoothstep(0.46, 0.52, r));
    float core = 1.0 - smoothstep(0.26, 0.31, r);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), core), max(max(ring, core), glow) * vO); }`

const LABEL_CSS = `
.pg-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.pg-pill{position:absolute;transform:translate(-50%,-140%);padding:3px 8px;border-radius:999px;background:rgba(17,24,39,.82);color:#fff;font:600 10px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.06em;white-space:nowrap;opacity:0;transition:opacity .3s}
.pg-pill.on{opacity:1}`

/** Parse any CSS colour to linear-ish RGB 0..1, using the browser. */
const colourCtx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null
const colourCache = new Map<string, [number, number, number]>()
function rgb(css: string): [number, number, number] {
  const hit = colourCache.get(css)
  if (hit) return hit
  const out = parseColour(css)
  colourCache.set(css, out)
  return out
}
function parseColour(css: string): [number, number, number] {
  if (!colourCtx) return [1, 1, 1]
  colourCtx.fillStyle = "#000"
  colourCtx.fillStyle = css
  const v = colourCtx.fillStyle as string
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const m = v.match(/[\d.]+/g) || ["255", "255", "255"]
  return [+m[0] / 255, +m[1] / 255, +m[2] / 255]
}

/** Create a globe inside `stage`. Returns null if WebGL isn't available. */
export function createParticleGlobe(stage: HTMLElement, input: GlobeInput = {}): ParticleGlobe | null {
  let o = merge(DEFAULT_OPTIONS, input)

  const canvas = document.createElement("canvas")
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y"
  const gl = (canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true }) ||
    canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true })) as WebGLRenderingContext | null
  if (!gl) return null
  const labelLayer = document.createElement("div")
  labelLayer.className = "pg-labels"
  if (getComputedStyle(stage).position === "static") stage.style.position = "relative"
  stage.append(canvas, labelLayer)
  if (!document.getElementById("pg-label-css")) {
    const st = document.createElement("style")
    st.id = "pg-label-css"
    st.textContent = LABEL_CSS
    document.head.appendChild(st)
  }

  // ---------- GL helpers ----------
  type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null>; a: Record<string, number> }
  const programs: WebGLProgram[] = []
  const buffers: WebGLBuffer[] = []
  function program(vs: string, fs: string): Prog {
    const sh = (type: number, src: string) => {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) || "shader")
      return s
    }
    const p = gl!.createProgram()!
    gl!.attachShader(p, sh(gl!.VERTEX_SHADER, vs))
    gl!.attachShader(p, sh(gl!.FRAGMENT_SHADER, fs))
    gl!.linkProgram(p)
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) throw new Error(gl!.getProgramInfoLog(p) || "link")
    programs.push(p)
    const u: Prog["u"] = {}
    const n = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS)
    for (let i = 0; i < n; i++) {
      const name = gl!.getActiveUniform(p, i)!.name
      u[name] = gl!.getUniformLocation(p, name)
    }
    const a: Prog["a"] = {}
    const na = gl!.getProgramParameter(p, gl!.ACTIVE_ATTRIBUTES)
    for (let i = 0; i < na; i++) {
      const name = gl!.getActiveAttrib(p, i)!.name
      a[name] = gl!.getAttribLocation(p, name)
    }
    return { p, u, a }
  }
  function buffer(data: Float32Array | Uint16Array | Uint32Array, index = false, usage: number = gl!.STATIC_DRAW) {
    const b = gl!.createBuffer()!
    const target = index ? gl!.ELEMENT_ARRAY_BUFFER : gl!.ARRAY_BUFFER
    gl!.bindBuffer(target, b)
    gl!.bufferData(target, data, usage)
    buffers.push(b)
    return b
  }
  function bindAttribs(pr: Prog, attrs: Record<string, [WebGLBuffer, number]>) {
    for (const name in pr.a) {
      const loc = pr.a[name]
      const at = attrs[name]
      if (!at) {
        gl!.disableVertexAttribArray(loc)
        continue
      }
      gl!.bindBuffer(gl!.ARRAY_BUFFER, at[0])
      gl!.enableVertexAttribArray(loc)
      gl!.vertexAttribPointer(loc, at[1], gl!.FLOAT, false, 0, 0)
    }
  }
  const set = (pr: Prog, name: string, v: number | number[] | Float32Array) => {
    const loc = pr.u[name]
    if (loc === undefined || loc === null) return
    if (typeof v === "number") gl!.uniform1f(loc, v)
    else if (v.length === 2) gl!.uniform2fv(loc, v as number[])
    else if (v.length === 3) gl!.uniform3fv(loc, v as number[])
    else if (v.length === 9) gl!.uniformMatrix3fv(loc, false, v as Float32Array)
    else gl!.uniformMatrix4fv(loc, false, v as Float32Array)
  }

  let progs: Record<"body" | "halo" | "dot" | "float" | "arc" | "ring", Prog>
  try {
    progs = {
      body: program(MESH_VERT, BODY_FRAG),
      halo: program(MESH_VERT, HALO_FRAG),
      dot: program(DOT_VERT, DOT_FRAG),
      float: program(FLOAT_VERT, DOT_FRAG),
      arc: program(ARC_VERT, ARC_FRAG),
      ring: program(RING_VERT, RING_FRAG),
    }
  } catch {
    canvas.remove()
    labelLayer.remove()
    return null
  }

  // ---------- geometry ----------
  function sphere(r: number, seg: number) {
    const pos: number[] = []
    const nor: number[] = []
    const idx: number[] = []
    for (let y = 0; y <= seg; y++) {
      const v = y / seg
      for (let x = 0; x <= seg; x++) {
        const u = x / seg
        const px = -Math.cos(u * 2 * Math.PI) * Math.sin(v * Math.PI)
        const py = Math.cos(v * Math.PI)
        const pz = Math.sin(u * 2 * Math.PI) * Math.sin(v * Math.PI)
        pos.push(px * r, py * r, pz * r)
        nor.push(px, py, pz)
      }
    }
    for (let y = 0; y < seg; y++)
      for (let x = 0; x < seg; x++) {
        const a = y * (seg + 1) + x
        const b = a + seg + 1
        if (y !== 0) idx.push(a, b, a + 1)
        if (y !== seg - 1) idx.push(b, b + 1, a + 1)
      }
    return { pos: buffer(new Float32Array(pos)), nor: buffer(new Float32Array(nor)), idx: buffer(new Uint16Array(idx), true), count: idx.length }
  }
  const bodyGeo = sphere(R * 0.995, 72)
  const haloGeo = sphere(R, 48)

  const pts = landPoints(70000)
  const n = pts.length / 2
  const dPos = new Float32Array(n * 3)
  const dLL = new Float32Array(n * 2)
  const dSeed = new Float32Array(n)
  const dSize = new Float32Array(n)
  const dKeep = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const lat = pts[i * 2]
    const lon = pts[i * 2 + 1]
    dPos.set(ll2v(lat, lon, R * 1.002), i * 3)
    dLL.set([lat, lon], i * 2)
    dSeed[i] = Math.random()
    dKeep[i] = Math.random()
    dSize[i] = 0.45 + Math.pow(Math.random(), 2) * 0.55
  }
  const dots = {
    position: [buffer(dPos), 3] as [WebGLBuffer, number],
    aLL: [buffer(dLL), 2] as [WebGLBuffer, number],
    aSeed: [buffer(dSeed), 1] as [WebGLBuffer, number],
    aSize: [buffer(dSize), 1] as [WebGLBuffer, number],
    aKeep: [buffer(dKeep), 1] as [WebGLBuffer, number],
  }

  const FN = 6000
  const fPos = new Float32Array(FN * 3)
  const fLL = new Float32Array(FN * 2)
  const fSeed = new Float32Array(FN)
  const fSize = new Float32Array(FN)
  const fKeep = new Float32Array(FN)
  const fPhase = new Float32Array(FN)
  for (let i = 0; i < FN; i++) {
    const j = Math.floor(Math.random() * n)
    const lat = pts[j * 2] + (Math.random() - 0.5) * 1.6
    const lon = pts[j * 2 + 1] + (Math.random() - 0.5) * 1.6
    fPos.set(ll2v(lat, lon, R * 1.004), i * 3)
    fLL.set([lat, lon], i * 2)
    fSeed[i] = Math.random()
    fKeep[i] = Math.random()
    fPhase[i] = Math.random()
    fSize[i] = 0.5 + Math.pow(Math.random(), 2) * 0.6
  }
  const floaters = {
    position: [buffer(fPos), 3] as [WebGLBuffer, number],
    aLL: [buffer(fLL), 2] as [WebGLBuffer, number],
    aSeed: [buffer(fSeed), 1] as [WebGLBuffer, number],
    aSize: [buffer(fSize), 1] as [WebGLBuffer, number],
    aKeep: [buffer(fKeep), 1] as [WebGLBuffer, number],
    aPhase: [buffer(fPhase), 1] as [WebGLBuffer, number],
  }

  // ---------- arcs ----------
  const SEG = 64
  const RAD = 6
  const STEP = 0.7
  const ARC_FEATHER = 0.05
  const DRAW = 1.6
  const HOLD = 1.4
  const ERASE = 1.2
  const LIFE = DRAW + HOLD + ERASE
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const bez = (p0: number[], p1: number[], p2: number[], p3: number[], t: number) => {
    const u = 1 - t
    return [0, 1, 2].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k])
  }
  const norm = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / l, v[1] / l, v[2] / l]
  }
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  /** Tube vertices around a curve; `side` is a fixed vector across the curve's plane. */
  function tube(curve: (t: number) => number[], side: number[], thick: number) {
    const out: number[] = []
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG
      const p = curve(t)
      const tan = norm(curve(Math.min(1, t + 0.001)).map((v, k) => v - curve(Math.max(0, t - 0.001))[k]))
      const nrm = norm(cross(tan, side))
      const bin = norm(cross(tan, nrm))
      for (let j = 0; j <= RAD; j++) {
        const a = (j / RAD) * Math.PI * 2
        const c = Math.cos(a) * thick
        const s = Math.sin(a) * thick
        out.push(p[0] + nrm[0] * c + bin[0] * s, p[1] + nrm[1] * c + bin[1] * s, p[2] + nrm[2] * c + bin[2] * s)
      }
    }
    return out
  }
  const tubeIdx: number[] = []
  for (let i = 0; i < SEG; i++)
    for (let j = 0; j < RAD; j++) {
      const a = i * (RAD + 1) + j
      const b = (i + 1) * (RAD + 1) + j
      tubeIdx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const tubeT = new Float32Array((SEG + 1) * (RAD + 1))
  for (let i = 0; i < tubeT.length; i++) tubeT[i] = Math.floor(i / (RAD + 1)) / SEG
  const tubeIdxBuf = buffer(new Uint16Array(tubeIdx), true)
  const tubeTBuf = buffer(tubeT)

  type Arc = { pos: WebGLBuffer; flat: WebGLBuffer; vb: number[]; pill: HTMLDivElement; idx: number; shift: number }
  let arcs: Arc[] = []
  let arcKey = ""
  let ring: { pos: WebGLBuffer; ll: WebGLBuffer; s: WebGLBuffer; o: WebGLBuffer; sArr: Float32Array; oArr: Float32Array; count: number } | null =
    null
  const freeBuf = (b: WebGLBuffer) => {
    gl!.deleteBuffer(b)
    const i = buffers.indexOf(b)
    if (i >= 0) buffers.splice(i, 1)
  }
  function clearArcs() {
    for (const a of arcs) {
      freeBuf(a.pos)
      freeBuf(a.flat)
      a.pill.remove()
    }
    arcs = []
    if (ring) [ring.pos, ring.ll, ring.s, ring.o].forEach(freeBuf)
    ring = null
  }
  function buildArcs() {
    const cfg = o.arcs
    const key = cfg ? JSON.stringify([cfg.routes, cfg.thickness, cfg.height, o.flatCentre]) : ""
    if (key === arcKey) return
    arcKey = key
    clearArcs()
    if (!cfg) return
    const centre = o.flatCentre
    const count = cfg.routes.length
    const rPos = new Float32Array(count * 6)
    const rLL = new Float32Array(count * 4)
    arcs = cfg.routes.map((r, i) => {
      const va = ll2v(r.from[0], r.from[1])
      const vb = ll2v(r.to[0], r.to[1])
      const lift = R + Math.hypot(va[0] - vb[0], va[1] - vb[1], va[2] - vb[2]) * cfg.height
      const sl = (t: number) => norm(va.map((v, k) => v + (vb[k] - v) * t))
      const p0 = va.map((v) => v * 1.004)
      const p1 = sl(0.25).map((v) => v * lift)
      const p2 = sl(0.75).map((v) => v * lift)
      const p3 = vb.map((v) => v * 1.004)
      const side = norm(cross(va, vb).every((v) => Math.abs(v) < 1e-6) ? [0, 1, 0] : cross(va, vb))
      const sph = tube((t) => bez(p0, p1, p2, p3, t), side, cfg.thickness)
      // Flat: the same arc drawn on the map, rising off it by its length.
      const a2 = flatXY(r.from[0], r.from[1], centre)
      let b2 = flatXY(r.to[0], r.to[1], centre)
      const wrapW = 2 * Math.PI * FLAT_K
      // An arc over the map's seam leaves one edge and is redrawn entering from the other.
      let shift = 0
      if (Math.abs(b2[0] - a2[0]) > wrapW / 2) {
        shift = Math.sign(b2[0] - a2[0]) * wrapW
        b2 = [b2[0] - shift, b2[1]]
      }
      const len = Math.hypot(b2[0] - a2[0], b2[1] - a2[1])
      const up = len * cfg.height * 0.6
      const f0 = [a2[0], a2[1], 0.002]
      const f3 = [b2[0], b2[1], 0.002]
      const f1 = [a2[0] + (b2[0] - a2[0]) * 0.25, a2[1] + (b2[1] - a2[1]) * 0.25 + up, 0.002]
      const f2 = [a2[0] + (b2[0] - a2[0]) * 0.75, a2[1] + (b2[1] - a2[1]) * 0.75 + up, 0.002]
      const flat = tube((t) => bez(f0, f1, f2, f3, t), [0, 0, 1], cfg.thickness)
      rPos.set(va.map((v) => v * 1.006), i * 6)
      rPos.set(vb.map((v) => v * 1.006), i * 6 + 3)
      rLL.set([r.from[0], r.from[1], r.to[0], r.to[1]], i * 4)
      const pill = document.createElement("div")
      pill.className = "pg-pill"
      pill.textContent = r.label ?? ""
      labelLayer.appendChild(pill)
      return { pos: buffer(new Float32Array(sph)), flat: buffer(new Float32Array(flat)), vb, pill, idx: i, shift }
    })
    const sArr = new Float32Array(count * 2)
    const oArr = new Float32Array(count * 2)
    ring = {
      pos: buffer(rPos),
      ll: buffer(rLL),
      s: buffer(sArr, false, gl!.DYNAMIC_DRAW),
      o: buffer(oArr, false, gl!.DYNAMIC_DRAW),
      sArr,
      oArr,
      count: count * 2,
    }
  }

  // ---------- state ----------
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)")
  const reduced = () => o.respectReducedMotion && reduceQuery.matches
  let morph = o.flat
  let morphFrom = morph
  let morphTo = morph
  let morphStart = 0

  let dragging = false
  let lastX = 0
  let vel = 0
  let userRot = 0
  const onDown = (e: PointerEvent) => {
    if (!o.draggable) return
    dragging = true
    lastX = e.clientX
    vel = 0
    canvas.setPointerCapture(e.pointerId)
    canvas.style.cursor = "grabbing"
  }
  const onMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    vel = dx * 0.005
    userRot += vel
  }
  const onUp = () => {
    dragging = false
    canvas.style.cursor = o.draggable ? "grab" : ""
  }
  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", onUp)

  let W = 1
  let H = 1
  let dpr = 1
  let proj = ident()
  let px = 1
  function resize() {
    W = Math.max(1, stage.clientWidth)
    H = Math.max(1, stage.clientHeight)
    dpr = Math.min(window.devicePixelRatio || 1, o.maxPixelRatio)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const fov = W >= H ? 30 : (2 * Math.atan(Math.tan(15 * DEG) * (H / W))) / DEG
    proj = perspective(fov * DEG, W / H, 0.1, 100)
    px = dpr * (Math.min(W, H) / 640) * 1.25
  }
  const ro = new ResizeObserver(resize)
  ro.observe(stage)
  resize()

  let onScreen = true
  const io = new IntersectionObserver((es) => {
    onScreen = es[0].isIntersecting
  })
  io.observe(stage)

  function applyStatic() {
    buildArcs()
    stage.style.background = o.background === "transparent" ? "" : o.background
    canvas.style.cursor = o.draggable ? "grab" : ""
  }

  // ---------- frame ----------
  const view = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -5, 1])
  let last = performance.now()
  let t = 0
  let spin = 0
  let arcT = 0
  let raf = 0
  let ready = false
  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (ready && o.pauseOffscreen && (!onScreen || document.hidden)) return
    const still = reduced()
    t += dt
    if (!dragging) {
      vel *= 0.94
      userRot += vel
    }
    if (o.rotation.auto && !still) spin += dt * o.rotation.speed * o.rotation.direction
    if (o.arcs) arcT += dt * o.arcs.speed
    if (morph !== morphTo) {
      const k = o.flatTransition > 0 && !still ? Math.min(1, (now - morphStart) / o.flatTransition) : 1
      morph = morphFrom + (morphTo - morphFrom) * ease(k)
    }

    const tiltM = mul(rot("x", o.rotation.tilt), rot("z", -0.12))
    const rotY = (-90 - o.rotation.startLongitude) * DEG + spin + userRot
    const model = mul(tiltM, rot("y", rotY))
    const mv = mul(view, model)

    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT)
    gl!.enable(gl!.BLEND)
    gl!.blendFuncSeparate(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA, gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
    gl!.enable(gl!.CULL_FACE)

    const common = (pr: Prog, m: Float32Array) => {
      gl!.useProgram(pr.p)
      set(pr, "modelViewMatrix", m)
      set(pr, "projectionMatrix", proj)
      set(pr, "normalMatrix", normal3(m))
      set(pr, "viewMatrix", view)
      set(pr, "uMorph", morph)
      set(pr, "uCentre", o.flatCentre)
      set(pr, "uFlatK", FLAT_K)
    }
    const grad = (pr: Prog) => {
      set(pr, "uC1", rgb(o.colors[0]))
      set(pr, "uC2", rgb(o.colors[1]))
      set(pr, "uC3", rgb(o.colors[2]))
      set(pr, "uAngle", o.gradientAngle * DEG)
      set(pr, "uMid", o.gradientMid)
    }
    const fade = 1 - morph

    // Atmosphere (back faces of a slightly larger sphere)
    if (o.atmosphere && fade > 0.001) {
      const pr = progs.halo
      common(pr, mul(view, mul(tiltM, scale(o.atmosphere.size))))
      set(pr, "uColor", rgb(o.atmosphere.color))
      set(pr, "uStr", o.atmosphere.strength * fade)
      gl!.cullFace(gl!.FRONT)
      gl!.disable(gl!.DEPTH_TEST)
      gl!.depthMask(false)
      bindAttribs(pr, { position: [haloGeo.pos, 3], normal: [haloGeo.nor, 3] })
      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, haloGeo.idx)
      gl!.drawElements(gl!.TRIANGLES, haloGeo.count, gl!.UNSIGNED_SHORT, 0)
    }

    // Globe body
    gl!.cullFace(gl!.BACK)
    gl!.enable(gl!.DEPTH_TEST)
    if (fade > 0.001) {
      const pr = progs.body
      common(pr, mv)
      set(pr, "uFill", rgb(o.globe.fill))
      set(pr, "uLimb", rgb(o.rim.color))
      set(pr, "uOp", o.globe.fillOpacity)
      set(pr, "uLimbStr", o.rim.strength)
      set(pr, "uFade", fade)
      gl!.depthMask(fade > 0.5)
      bindAttribs(pr, { position: [bodyGeo.pos, 3], normal: [bodyGeo.nor, 3] })
      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, bodyGeo.idx)
      gl!.drawElements(gl!.TRIANGLES, bodyGeo.count, gl!.UNSIGNED_SHORT, 0)
    }
    gl!.depthMask(false)

    // Arcs
    const arcTime = still ? DRAW + 0.5 : arcT
    if (o.arcs && arcs.length) {
      const pr = progs.arc
      common(pr, mv)
      set(pr, "uA", rgb(o.arcs.colors[0]))
      set(pr, "uB", rgb(o.arcs.colors[1]))
      set(pr, "uEdge", FLAT_W / 2)
      gl!.disable(gl!.CULL_FACE)
      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, tubeIdxBuf)
      const indices = SEG * RAD * 6
      // The loop must outlast one arc's life, or few routes get cut off mid-fade.
      const cycle = Math.max(arcs.length * STEP, LIFE + 0.8)
      for (const a of arcs) {
        const tt = (((arcTime - (a.idx * cycle) / arcs.length) % cycle) + cycle) % cycle
        let start = 0
        let end = 0
        if (tt < DRAW) end = ease(tt / DRAW)
        else if (tt < DRAW + HOLD) end = 1
        else if (tt < LIFE) {
          end = 1
          start = ease((tt - DRAW - HOLD) / ERASE)
        }
        // The reveal happens per pixel in the shader, with soft ends, so it never steps.
        if (end > 0 && start < 1) {
          set(pr, "uStart", start * (1 + ARC_FEATHER))
          set(pr, "uEnd", end * (1 + ARC_FEATHER) - ARC_FEATHER)
          set(pr, "uFeather", ARC_FEATHER)
          bindAttribs(pr, { position: [a.pos, 3], aFlat: [a.flat, 3], aT: [tubeTBuf, 1] })
          set(pr, "uShift", 0)
          set(pr, "uOp", o.arcs.opacity)
          gl!.drawElements(gl!.TRIANGLES, indices, gl!.UNSIGNED_SHORT, 0)
          if (a.shift && morph > 0.001) {
            set(pr, "uShift", a.shift)
            set(pr, "uOp", o.arcs.opacity * morph * morph)
            gl!.drawElements(gl!.TRIANGLES, indices, gl!.UNSIGNED_SHORT, 0)
          }
        }
        const live = tt < LIFE
        const landed = live && tt >= DRAW * 0.92
        if (ring) {
          ring.sArr[a.idx * 2] = 0.8
          ring.oArr[a.idx * 2] = live ? Math.min(1, tt / 0.25) * 0.85 * (1 - Math.min(1, Math.max(0, (start - 0.6) / 0.4))) : 0
          ring.sArr[a.idx * 2 + 1] = landed ? 1 + 0.25 * Math.max(0, 1 - (tt - DRAW * 0.92) / 0.5) : 1
          ring.oArr[a.idx * 2 + 1] = landed ? Math.min(1, (tt - DRAW * 0.92) / 0.25) * (tt > LIFE - 0.3 ? (LIFE - tt) / 0.3 : 1) : 0
        }
        // Label at the destination, only on the visible face
        let show = o.arcs.labels && !!a.pill.textContent && landed && tt < DRAW + HOLD && morph < 0.5
        if (show) {
          const w = apply4(mv, a.vb[0], a.vb[1], a.vb[2])
          // View-space z of the point minus the centre's: how much it faces the camera.
          const facing = w[2] - apply4(mv, 0, 0, 0)[2]
          if (facing < 0.15) show = false
          else {
            const c = apply4(proj, w[0], w[1], w[2])
            const x = (c[0] / c[3] * 0.5 + 0.5) * W
            const y = (-c[1] / c[3] * 0.5 + 0.5) * H
            if (x < 30 || x > W - 30 || y < 30 || y > H - 10) show = false
            else {
              a.pill.style.left = x + "px"
              a.pill.style.top = y + "px"
            }
          }
        }
        a.pill.classList.toggle("on", show)
      }
      gl!.enable(gl!.CULL_FACE)
    }

    // Land dots (drawn over everything; the far side fades in the shader)
    gl!.disable(gl!.DEPTH_TEST)
    {
      const pr = progs.dot
      common(pr, mv)
      grad(pr)
      set(pr, "uTime", still ? 0 : t)
      set(pr, "uPx", px * 2.2)
      set(pr, "uSize", o.dots.size)
      set(pr, "uDensity", o.dots.density)
      set(pr, "uTwinkle", o.dots.twinkle)
      set(pr, "uHl", o.dots.highlight)
      set(pr, "uHlPos", [0.42, -0.05])
      set(pr, "uIntensity", o.dots.intensity)
      set(pr, "uBack", o.dots.farSide)
      set(pr, "uVar", o.dots.sizeVariation)
      bindAttribs(pr, dots)
      gl!.drawArrays(gl!.POINTS, 0, n)
    }

    // Floating particles
    if (o.particles) {
      gl!.enable(gl!.DEPTH_TEST)
      const pr = progs.float
      common(pr, mv)
      grad(pr)
      set(pr, "uTime", still ? 0.3 : t)
      set(pr, "uPx", px * 2.2)
      set(pr, "uSize", o.particles.size)
      set(pr, "uAmt", o.particles.amount)
      set(pr, "uH", o.particles.rise)
      set(pr, "uSpeed", o.particles.speed)
      set(pr, "uDrift", o.particles.drift)
      set(pr, "uOp", o.particles.opacity * Math.min(1, o.dots.intensity))
      set(pr, "uVar", o.dots.sizeVariation)
      bindAttribs(pr, floaters)
      gl!.drawArrays(gl!.POINTS, 0, FN)
      gl!.disable(gl!.DEPTH_TEST)
    }

    // Endpoint rings
    if (o.arcs && o.arcs.rings && ring) {
      const pr = progs.ring
      common(pr, mv)
      set(pr, "uPx", px * (o.arcs.ringSize ?? 1))
      set(pr, "uColor", rgb(o.arcs.colors[1]))
      gl!.bindBuffer(gl!.ARRAY_BUFFER, ring.s)
      gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, ring.sArr)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, ring.o)
      gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, ring.oArr)
      bindAttribs(pr, { position: [ring.pos, 3], aLL: [ring.ll, 2], aS: [ring.s, 1], aO: [ring.o, 1] })
      gl!.drawArrays(gl!.POINTS, 0, ring.count)
    }

    if (!ready) {
      ready = true
      o.onReady?.()
    }
  }

  applyStatic()
  raf = requestAnimationFrame(frame)

  return {
    get options() {
      return o
    },
    update(next: GlobeInput) {
      const prevStart = o.rotation.startLongitude
      o = merge(o, next)
      if (o.rotation.startLongitude !== prevStart) {
        spin = 0
        userRot = 0
        vel = 0
      }
      if (o.flat !== morphTo) {
        morphFrom = morph
        morphTo = Math.max(0, Math.min(1, o.flat))
        morphStart = performance.now()
      }
      applyStatic()
      resize()
    },
    resize,
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      clearArcs()
      buffers.forEach((b) => gl!.deleteBuffer(b))
      programs.forEach((p) => gl!.deleteProgram(p))
      gl!.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
      labelLayer.remove()
    },
  }
}
