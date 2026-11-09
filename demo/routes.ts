// Route generator for the customiser: real cities, and routes that never cross each other.
// "Cross" is tested on the globe (great-circle ground tracks) and on the flat map (the drawn curve,
// including copies that wrap over the seam), so a set stays clean in both projections.
import type { ArcRoute } from "../src/index"

type Region = "NA" | "SA" | "EU" | "AF" | "AS" | "OC"
type City = { name: string; lat: number; lon: number; region: Region }
const c = (name: string, lat: number, lon: number, region: Region): City => ({ name, lat, lon, region })

/** Real cities, well spread over every inhabited continent. Coordinates are the cities' own, to two decimals. */
export const CITIES: City[] = [
  c("New York", 40.71, -74.01, "NA"), c("Los Angeles", 34.05, -118.24, "NA"), c("Chicago", 41.88, -87.63, "NA"),
  c("Toronto", 43.65, -79.38, "NA"), c("Vancouver", 49.28, -123.12, "NA"), c("Mexico City", 19.43, -99.13, "NA"),
  c("Houston", 29.76, -95.37, "NA"), c("Miami", 25.76, -80.19, "NA"), c("Anchorage", 61.22, -149.9, "NA"),
  c("Panama City", 8.98, -79.52, "NA"), c("Honolulu", 21.31, -157.86, "OC"),
  c("Sao Paulo", -23.55, -46.63, "SA"), c("Buenos Aires", -34.6, -58.38, "SA"), c("Lima", -12.05, -77.04, "SA"),
  c("Bogota", 4.71, -74.07, "SA"), c("Santiago", -33.45, -70.67, "SA"), c("Caracas", 10.48, -66.9, "SA"),
  c("Manaus", -3.12, -60.02, "SA"), c("Recife", -8.05, -34.88, "SA"),
  c("London", 51.51, -0.13, "EU"), c("Paris", 48.86, 2.35, "EU"), c("Madrid", 40.42, -3.7, "EU"), c("Rome", 41.9, 12.5, "EU"),
  c("Berlin", 52.52, 13.41, "EU"), c("Stockholm", 59.33, 18.07, "EU"), c("Reykjavik", 64.15, -21.94, "EU"),
  c("Moscow", 55.76, 37.62, "EU"), c("Istanbul", 41.01, 28.98, "EU"), c("Lisbon", 38.72, -9.14, "EU"),
  c("Athens", 37.98, 23.73, "EU"), c("Helsinki", 60.17, 24.94, "EU"), c("Dublin", 53.35, -6.26, "EU"),
  c("Cairo", 30.04, 31.24, "AF"), c("Lagos", 6.52, 3.38, "AF"), c("Nairobi", -1.29, 36.82, "AF"),
  c("Johannesburg", -26.2, 28.05, "AF"), c("Cape Town", -33.92, 18.42, "AF"), c("Casablanca", 33.57, -7.59, "AF"),
  c("Addis Ababa", 9.03, 38.74, "AF"), c("Dakar", 14.72, -17.47, "AF"), c("Kinshasa", -4.44, 15.27, "AF"),
  c("Accra", 5.6, -0.19, "AF"), c("Dar es Salaam", -6.79, 39.21, "AF"), c("Luanda", -8.84, 13.23, "AF"),
  c("Tokyo", 35.68, 139.69, "AS"), c("Seoul", 37.57, 126.98, "AS"), c("Beijing", 39.9, 116.41, "AS"),
  c("Shanghai", 31.23, 121.47, "AS"), c("Hong Kong", 22.32, 114.17, "AS"), c("Singapore", 1.35, 103.82, "AS"),
  c("Bangkok", 13.76, 100.5, "AS"), c("Mumbai", 19.08, 72.88, "AS"), c("Delhi", 28.61, 77.21, "AS"),
  c("Dubai", 25.2, 55.27, "AS"), c("Tehran", 35.69, 51.39, "AS"), c("Jakarta", -6.21, 106.85, "AS"),
  c("Manila", 14.6, 120.98, "AS"), c("Karachi", 24.86, 67.01, "AS"), c("Riyadh", 24.71, 46.68, "AS"),
  c("Dhaka", 23.81, 90.41, "AS"), c("Almaty", 43.24, 76.89, "AS"), c("Novosibirsk", 55.03, 82.92, "AS"),
  c("Vladivostok", 43.12, 131.89, "AS"), c("Ulaanbaatar", 47.89, 106.91, "AS"), c("Colombo", 6.93, 79.86, "AS"),
  c("Ho Chi Minh City", 10.82, 106.63, "AS"), c("Kuala Lumpur", 3.14, 101.69, "AS"), c("Yakutsk", 62.04, 129.74, "AS"),
  c("Sydney", -33.87, 151.21, "OC"), c("Melbourne", -37.81, 144.96, "OC"), c("Perth", -31.95, 115.86, "OC"),
  c("Auckland", -36.85, 174.76, "OC"), c("Brisbane", -27.47, 153.03, "OC"), c("Darwin", -12.46, 130.84, "OC"),
  c("Port Moresby", -9.44, 147.18, "OC"), c("Suva", -18.14, 178.44, "OC"),
]

// ---------- geometry (mirrors buildArcs in the library, at its default flatCentre and arc height) ----------
const DEG = Math.PI / 180
const FLAT_W = 2.36
const FLAT_K = FLAT_W / (2 * Math.PI)
const MAX_LAT = 80
const CENTRE = 10
const HEIGHT = 0.42
const GN = 22 // samples along a great circle
const FN = 36 // samples along the flat curve
type V = number[]
const ll2v = (lat: number, lon: number): V => [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG)]
const angleBetween = (a: V, b: V) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))

function flatXY(lat: number, lon: number): [number, number] {
  let d = lon - CENTRE
  d = ((((d + 180) % 360) + 360) % 360) - 180
  const la = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * DEG
  return [d * DEG * FLAT_K, Math.log(Math.tan(Math.PI / 4 + la / 2)) * FLAT_K]
}
const bez1 = (a: number, b: number, c2: number, d: number, t: number) => {
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c2 + t * t * t * d
}

type Box = number[]
const boxOf = (pts: V[]): Box => [0, 1, 2].flatMap((k) => [Math.min(...pts.map((p) => p[k])), Math.max(...pts.map((p) => p[k]))])
const apart = (a: Box, b: Box, tol: number) => [0, 1, 2].some((k) => a[k * 2] > b[k * 2 + 1] + tol || b[k * 2] > a[k * 2 + 1] + tol)
type Geo = { from: [number, number]; to: [number, number]; globe: V[]; flat: V[][]; gBox: Box; fBox: Box[] }
function geoOf(from: [number, number], to: [number, number]): Geo {
  const va = ll2v(from[0], from[1])
  const vb = ll2v(to[0], to[1])
  const om = angleBetween(va, vb)
  const so = Math.sin(om) || 1
  const globe: V[] = []
  for (let i = 0; i <= GN; i++) {
    const t = i / GN
    const k1 = Math.sin((1 - t) * om) / so
    const k2 = Math.sin(t * om) / so
    globe.push([0, 1, 2].map((k) => va[k] * k1 + vb[k] * k2))
  }
  // Flat: same construction as the library, including the redraw of an arc over the seam.
  const wrapW = 2 * Math.PI * FLAT_K
  const a2 = flatXY(from[0], from[1])
  let b2 = flatXY(to[0], to[1])
  let shift = 0
  if (Math.abs(b2[0] - a2[0]) > wrapW / 2) {
    shift = Math.sign(b2[0] - a2[0]) * wrapW
    b2 = [b2[0] - shift, b2[1]]
  }
  const len = Math.hypot(b2[0] - a2[0], b2[1] - a2[1])
  const up = len * HEIGHT * 0.6
  const x1 = a2[0] + (b2[0] - a2[0]) * 0.25
  const x2 = a2[0] + (b2[0] - a2[0]) * 0.75
  const y1 = a2[1] + (b2[1] - a2[1]) * 0.25 + up
  const y2 = a2[1] + (b2[1] - a2[1]) * 0.75 + up
  const base: V[] = []
  for (let i = 0; i <= FN; i++) {
    const t = i / FN
    base.push([bez1(a2[0], x1, x2, b2[0], t), bez1(a2[1], y1, y2, b2[1], t), 0])
  }
  const flat = [base]
  if (shift) flat.push(base.map((p) => [p[0] + shift, p[1], 0]))
  return { from, to, globe, flat, gBox: boxOf(globe), fBox: flat.map(boxOf) }
}

/** Closest distance between segments p1q1 and p2q2 (works in 2D with z = 0). */
function segDist(p1: V, q1: V, p2: V, q2: V): number {
  const d1 = [q1[0] - p1[0], q1[1] - p1[1], q1[2] - p1[2]]
  const d2 = [q2[0] - p2[0], q2[1] - p2[1], q2[2] - p2[2]]
  const r = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]]
  const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const a = dot(d1, d1)
  const e = dot(d2, d2)
  const f = dot(d2, r)
  const cl = (x: number) => Math.min(1, Math.max(0, x))
  let s: number
  let t: number
  if (a < 1e-12 && e < 1e-12) return Math.hypot(r[0], r[1], r[2])
  if (a < 1e-12) {
    s = 0
    t = cl(f / e)
  } else {
    const cc = dot(d1, r)
    if (e < 1e-12) {
      t = 0
      s = cl(-cc / a)
    } else {
      const b = dot(d1, d2)
      const den = a * e - b * b
      s = den > 1e-12 ? cl((b * f - cc * e) / den) : 0
      t = (b * s + f) / e
      if (t < 0) {
        t = 0
        s = cl(-cc / a)
      } else if (t > 1) {
        t = 1
        s = cl((b - cc) / a)
      }
    }
  }
  return Math.hypot(r[0] + d1[0] * s - d2[0] * t, r[1] + d1[1] * s - d2[1] * t, r[2] + d1[2] * s - d2[2] * t)
}

const TOL_GLOBE = 0.03 // about 1.7 degrees of arc: close passes count as touching
const TOL_FLAT = 0.012
const HALF_W = FLAT_W / 2 + 0.01
const near = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) < 0.06 && Math.abs(a[1] - b[1]) < 0.06

const RHO_GLOBE = 0.05 // arcs may meet at a shared city; closer than this to it, contact is ignored
const RHO_FLAT = 0.03
const dist = (p: V, q: V) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
const mid = (p: V, q: V): V => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]

/** Does polyline `a` come within `tol` of `b`? Contact right at a shared end city (`endA`, `endB`) is ignored. */
function touches(a: V[], b: V[], tol: number, endA: V | null, endB: V | null, rho: number, flat: boolean): boolean {
  for (let i = 0; i < a.length - 1; i++) {
    if (flat && Math.abs(a[i][0]) > HALF_W && Math.abs(a[i + 1][0]) > HALF_W) continue
    const ma = endA ? dist(mid(a[i], a[i + 1]), endA) : Infinity
    for (let j = 0; j < b.length - 1; j++) {
      if (flat && Math.abs(b[j][0]) > HALF_W && Math.abs(b[j + 1][0]) > HALF_W) continue
      if (endB && ma < rho && dist(mid(b[j], b[j + 1]), endB) < rho) continue
      if (segDist(a[i], a[i + 1], b[j], b[j + 1]) < tol) return true
    }
  }
  return false
}

/** True if routes a and b cross or touch, on the globe or on the flat map. Sharing an end city is fine. */
function conflict(a: Geo, b: Geo): boolean {
  const ends: Array<[0 | 1, 0 | 1]> = []
  for (const i of [0, 1] as const) for (const j of [0, 1] as const) if (near(i ? a.to : a.from, j ? b.to : b.from)) ends.push([i, j])
  if (ends.length > 1) return true // same two cities (either way round)
  const e = ends[0]
  const tip = (pts: V[], end: 0 | 1) => pts[end ? pts.length - 1 : 0]
  if (!apart(a.gBox, b.gBox, TOL_GLOBE) && touches(a.globe, b.globe, TOL_GLOBE, e ? tip(a.globe, e[0]) : null, e ? tip(b.globe, e[1]) : null, RHO_GLOBE, false)) return true
  for (let x = 0; x < a.flat.length; x++)
    for (let y = 0; y < b.flat.length; y++)
      if (!apart(a.fBox[x], b.fBox[y], TOL_FLAT) && touches(a.flat[x], b.flat[y], TOL_FLAT, e ? tip(a.flat[x], e[0]) : null, e ? tip(b.flat[y], e[1]) : null, RHO_FLAT, true)) return true
  return false
}

// ---------- picking ----------
const MAX_PER_CITY = 2
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}
type Cand = { i: number; j: number; geo: Geo; deg: number; route: ArcRoute }
let cands: Cand[] | null = null
function candidates(): Cand[] {
  if (cands) return cands
  cands = []
  for (let i = 0; i < CITIES.length; i++)
    for (let j = i + 1; j < CITIES.length; j++) {
      const A = CITIES[i]
      const B = CITIES[j]
      const deg = angleBetween(ll2v(A.lat, A.lon), ll2v(B.lat, B.lon)) / DEG
      if (deg < 28 || deg > 150) continue
      const flip = (i + j) % 2 === 1
      const [F, T] = flip ? [B, A] : [A, B]
      const route: ArcRoute = { from: [F.lat, F.lon], to: [T.lat, T.lon], label: T.name }
      cands.push({ i, j, geo: geoOf(route.from, route.to), deg, route })
    }
  return cands
}
const cityAt = (p: [number, number]) => CITIES.findIndex((c2) => near([c2.lat, c2.lon], p))

/**
 * The routes to append to `existing`, in order, each one crossing nothing before it. Deterministic, so
 * the first k of them are what you get when you ask for k more. Its length is how many more still fit.
 */
export function fillRoutes(existing: ArcRoute[], limit = Infinity): ArcRoute[] {
  const have = existing.map((r) => geoOf(r.from, r.to))
  const uses = new Array(CITIES.length).fill(0)
  const region: Record<string, number> = {}
  for (const r of existing)
    for (const p of [r.from, r.to]) {
      const k = cityAt(p)
      if (k >= 0) {
        uses[k]++
        region[CITIES[k].region] = (region[CITIES[k].region] ?? 0) + 1
      }
    }
  let pool = candidates().filter((cd) => uses[cd.i] < MAX_PER_CITY && uses[cd.j] < MAX_PER_CITY && !have.some((g) => conflict(cd.geo, g)))
  const out: ArcRoute[] = []
  while (pool.length && out.length < limit) {
    let best = pool[0]
    let bestScore = -Infinity
    for (const cd of pool) {
      const ra = CITIES[cd.i].region
      const rb = CITIES[cd.j].region
      const hop = cd.deg < 40 ? -0.4 : cd.deg <= 115 ? 0.5 : 0.15
      const sc =
        hop - 2 * (uses[cd.i] + uses[cd.j]) - 0.12 * ((region[ra] ?? 0) + (region[rb] ?? 0)) + (ra !== rb ? 0.4 : 0) + 0.6 * hash(CITIES[cd.i].name + CITIES[cd.j].name)
      if (sc > bestScore) {
        bestScore = sc
        best = cd
      }
    }
    out.push(best.route)
    uses[best.i]++
    uses[best.j]++
    region[CITIES[best.i].region] = (region[CITIES[best.i].region] ?? 0) + 1
    region[CITIES[best.j].region] = (region[CITIES[best.j].region] ?? 0) + 1
    pool = pool.filter((cd) => cd !== best && uses[cd.i] < MAX_PER_CITY && uses[cd.j] < MAX_PER_CITY && !conflict(cd.geo, best.geo))
  }
  return out
}

/** How many routes the demo starts with. */
export const DEFAULT_COUNT = 18
export const demoRoutes = (): ArcRoute[] => fillRoutes([], DEFAULT_COUNT)

// The last answer, so dragging the slider up or down reuses it instead of searching again.
let memo: { have: ArcRoute[]; add: ArcRoute[] } | null = null
const sameRoute = (a: ArcRoute, b: ArcRoute) => a.from[0] === b.from[0] && a.from[1] === b.from[1] && a.to[0] === b.to[0] && a.to[1] === b.to[1]
/** The answer for `existing` if it is already known (the same set, or a prefix or extension of the last one), else null. */
export function peekFill(existing: ArcRoute[]): ArcRoute[] | null {
  if (!memo) return null
  const seq = memo.have.concat(memo.add)
  const n = existing.length
  if (n < memo.have.length || n > seq.length || !existing.every((r, i) => sameRoute(r, seq[i]))) return null
  return seq.slice(n)
}
/** Routes that can still be appended to `existing` without crossing anything. */
export function fillCached(existing: ArcRoute[]): ArcRoute[] {
  const known = peekFill(existing)
  if (known) return known
  memo = { have: existing.map((r) => ({ ...r })), add: fillRoutes(existing) }
  return memo.add
}
