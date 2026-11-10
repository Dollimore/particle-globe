import { demoRoutes, fillCached, peekFill } from "./routes"
import { createParticleGlobe, DEFAULT_MARKERS, DEFAULT_OPTIONS, REGIONS, type ArcRoute, type MarkerPlace, type GlobeInput, type GlobeOptions, type RegionName } from "../src/index"

// ---------- presets ----------
// Each preset is a designed pair: `shared` holds the character (shape, motion, dot behaviour),
// `light` and `dark` hold the full look for that theme (stage, dots, rim, globe fill, arcs).
type Theme = "light" | "dark"
type Swatch = [string, string, string]
type Preset = { name: string; swatch: Swatch; swatchAlt?: Partial<Record<Theme, Swatch>>; shared?: GlobeInput; light: GlobeInput; dark: GlobeInput; atmo: Record<Theme, string> }
const PRESETS: Preset[] = [
  {
    name: "Stripe",
    swatch: ["#6b54f5", "#db61db", "#eb4d54"],
    atmo: { light: "#9e94ff", dark: "#7c6cff" },
    light: { background: "#ffffff" },
    dark: {
      colors: ["#8f7bff", "#e873e8", "#ff6b78"], gradientAngle: 57,
      dots: { highlight: 0.55, intensity: 1.1, farSide: 0.4 },
      rim: { color: "#5b46e0", strength: 0.75 },
      arcs: { colors: ["#ff7fa3", "#ffb36b"] },
      globe: { fill: "#110e2b", fillOpacity: 0.92 }, background: "#0a0820",
    },
  },
  {
    // Arcs off, markers on: cities appear one by one with a pulse and a label.
    name: "Cities",
    swatch: ["#0f766e", "#0ea5e9", "#6366f1"],
    atmo: { light: "#5eead4", dark: "#2dd4bf" },
    shared: { gradientAngle: 80, arcs: false, markers: { ...DEFAULT_MARKERS } },
    light: {
      colors: ["#0f766e", "#0ea5e9", "#6366f1"], dots: { highlight: 0.6 },
      rim: { color: "#d4ece8", strength: 1 }, markers: { color: "#e5484d" }, background: "#f3f8f7",
    },
    dark: {
      colors: ["#2dd4bf", "#38bdf8", "#818cf8"], dots: { highlight: 0.45, intensity: 1.1, farSide: 0.4 },
      rim: { color: "#0f766e", strength: 0.7 }, markers: { color: "#fbbf24" },
      globe: { fill: "#07191c", fillOpacity: 0.92 }, background: "#041012",
    },
  },
  {
    name: "Midnight",
    swatch: ["#3b82f6", "#22d3ee", "#a78bfa"],
    atmo: { light: "#60a5fa", dark: "#3b82f6" },
    shared: { gradientAngle: 90 },
    light: {
      colors: ["#2563eb", "#0891b2", "#7c3aed"],
      dots: { highlight: 0.6, intensity: 1.05 },
      rim: { color: "#c3d3f5", strength: 1 },
      arcs: { colors: ["#0e7490", "#a21caf"] },
      globe: { fill: "#ffffff", fillOpacity: 0.96 }, background: "#eef3fc",
    },
    dark: {
      colors: ["#3b82f6", "#22d3ee", "#a78bfa"],
      dots: { highlight: 0.4, intensity: 1.1, farSide: 0.45 },
      rim: { color: "#3b5bdb", strength: 0.8 },
      arcs: { colors: ["#22d3ee", "#f0abfc"] },
      globe: { fill: "#0b1224", fillOpacity: 0.9 }, background: "#070b16",
    },
  },
  {
    name: "Emerald",
    swatch: ["#0f5132", "#1d7a49", "#4cc283"],
    atmo: { light: "#4cc283", dark: "#2fb673" },
    shared: { gradientAngle: 70 },
    light: {
      colors: ["#0f5132", "#1d7a49", "#4cc283"], dots: { highlight: 0.6 },
      rim: { color: "#dcefe3" }, arcs: { colors: ["#1d7a49", "#a3e635"] }, background: "#f4f6f2",
    },
    dark: {
      colors: ["#1f9d63", "#4cc283", "#bef264"],
      dots: { highlight: 0.5, intensity: 1.1, farSide: 0.4 },
      rim: { color: "#1d7a49", strength: 0.7 },
      arcs: { colors: ["#4ade80", "#d9f99d"] },
      globe: { fill: "#0a1a11", fillOpacity: 0.92 }, background: "#060f0a",
    },
  },
  {
    name: "Mono",
    swatch: ["#111827", "#111827", "#111827"],
    swatchAlt: { dark: ["#f3f4f6", "#d1d5db", "#9ca3af"] },
    atmo: { light: "#9ca3af", dark: "#9ca3af" },
    light: {
      colors: ["#111827", "#111827", "#111827"], dots: { highlight: 0.65, twinkle: 0.15 },
      rim: { color: "#f1f2f4" }, arcs: { colors: ["#111827", "#111827"], opacity: 0.85 }, background: "#ffffff",
    },
    dark: {
      colors: ["#f3f4f6", "#f3f4f6", "#f3f4f6"], dots: { highlight: 0.6, twinkle: 0.15, farSide: 0.35 },
      rim: { color: "#2c2c2f", strength: 0.8 }, arcs: { colors: ["#f3f4f6", "#f3f4f6"], opacity: 0.85 },
      globe: { fill: "#111112", fillOpacity: 1 }, background: "#09090a",
    },
  },
  {
    name: "Sunset",
    swatch: ["#f97316", "#ec4899", "#fde047"],
    atmo: { light: "#fb923c", dark: "#f97316" },
    shared: { gradientAngle: 120 },
    light: {
      colors: ["#ea580c", "#db2777", "#d99a06"], dots: { highlight: 0.55 },
      rim: { color: "#fcd9bd", strength: 1 }, arcs: { colors: ["#c2410c", "#be185d"] },
      globe: { fill: "#ffffff", fillOpacity: 0.96 }, background: "#fff5ec",
    },
    dark: {
      colors: ["#f97316", "#ec4899", "#fde047"], dots: { highlight: 0.35, farSide: 0.4 },
      rim: { color: "#7c2d12", strength: 0.7 }, arcs: { colors: ["#fde047", "#fb7185"] },
      globe: { fill: "#20121a", fillOpacity: 0.92 }, background: "#1a0f14",
    },
  },
  {
    name: "Ice",
    swatch: ["#94a3b8", "#60a5fa", "#e0f2fe"],
    atmo: { light: "#93c5fd", dark: "#7dd3fc" },
    shared: { gradientAngle: 200, dots: { size: 1.3, density: 0.8 } },
    light: {
      colors: ["#94a3b8", "#60a5fa", "#e0f2fe"], dots: { highlight: 0.5, intensity: 1.2 },
      rim: { color: "#dbeafe" }, arcs: { colors: ["#38bdf8", "#818cf8"] }, globe: { fill: "#f8fbff" }, background: "#eef5fc",
    },
    dark: {
      colors: ["#7dd3fc", "#38bdf8", "#e0f2fe"], dots: { highlight: 0.5, intensity: 1.15, farSide: 0.4 },
      rim: { color: "#1e4a7a", strength: 0.8 }, arcs: { colors: ["#7dd3fc", "#a5b4fc"] },
      globe: { fill: "#0a1b2e", fillOpacity: 0.92 }, background: "#06101c",
    },
  },
  {
    name: "Ink",
    swatch: ["#f6f3ec", "#b8b4ae", "#8a8a8a"],
    swatchAlt: { light: ["#161616", "#4a4a4a", "#8a8a8a"] },
    atmo: { light: "#8a8a8a", dark: "#b8b4ae" },
    shared: { gradientAngle: 300, particles: { amount: 0.35, opacity: 0.5 } },
    light: {
      colors: ["#161616", "#4a4a4a", "#8a8a8a"], dots: { intensity: 1, density: 0.6, highlight: 0.6, twinkle: 0.2 },
      rim: { color: "#dedad1", strength: 1 }, globe: { fill: "#fbfaf6", fillOpacity: 1 },
      arcs: { colors: ["#7a7a7a", "#111111"], opacity: 0.9 }, background: "#f3f0e8",
    },
    dark: {
      colors: ["#f6f3ec", "#b8b4ae", "#8a8a8a"], dots: { intensity: 1.1, density: 0.6, highlight: 0.6, twinkle: 0.25 },
      rim: { color: "#3a3a3a", strength: 0.6 }, globe: { fill: "#121212", fillOpacity: 1 },
      arcs: { colors: ["#8a8a8a", "#f6f3ec"], opacity: 0.9 }, background: "#0a0a0b",
    },
  },
]

// ---------- control map ----------
type Group = "particles" | "atmosphere" | "arcs" | "markers"
type RangeRow = { type: "range"; path: string; label: string; min: number; max: number; step: number; unit?: string; scale?: number; showIf?: string; globeOnly?: boolean }
type ColorRow = { type: "color"; path: string; label: string }
type ToggleRow = { type: "toggle"; path: string; label: string; globeOnly?: boolean }
type SegRow = { type: "seg"; path: string; label: string; options: Array<[number | string, string]>; wrap?: boolean; showIf?: string }
type Row = RangeRow | ColorRow | ToggleRow | SegRow
type ColorSet = { type: "colorset"; fields: Array<{ path: string; label: string }>; bar?: boolean }
type Routes = { type: "routes"; path: string }
type Places = { type: "places"; path: string }
type RegionRow = { type: "region"; path: string }
type Item = Row | ColorSet | Routes | Places | RegionRow
type Section = { title: string; group?: Group; open?: boolean; globeOnly?: boolean; items: Item[]; more?: Item[] }

const pct = (path: string, label: string, min = 0, max = 1, step = 0.01): RangeRow => ({ type: "range", path, label, min, max, step, unit: "%", scale: 100 })
const num = (path: string, label: string, min: number, max: number, step: number, unit?: string): RangeRow => ({ type: "range", path, label, min, max, step, unit })

const ICON_STYLES: Array<[string, string]> = [["ring", "Ring"], ["solid", "Solid"]]
const SECTIONS: Section[] = [
  { title: "Region", open: true, items: [{ type: "region", path: "focus" }] },
  {
    title: "Colours", open: true,
    items: [
      { type: "colorset", bar: true, fields: [{ path: "colors.0", label: "Start colour" }, { path: "colors.1", label: "Middle colour" }, { path: "colors.2", label: "End colour" }] },
      num("gradientAngle", "Angle", 0, 360, 1, "°"),
      { type: "color", path: "background", label: "Background" },
    ],
    more: [num("gradientMid", "Middle stop", 0.1, 0.9, 0.01)],
  },
  {
    title: "Dots", open: true,
    items: [pct("dots.density", "Density", 0.05, 5, 0.05), num("dots.size", "Size", 0.1, 4, 0.05), num("dots.intensity", "Brightness", 0, 2, 0.01)],
    more: [num("dots.sizeVariation", "Size variation", 0, 2.5, 0.05), pct("dots.twinkle", "Twinkle"), pct("dots.highlight", "Highlight fade"), { ...pct("dots.farSide", "Far side"), globeOnly: true }],
  },
  {
    title: "Particles", group: "particles",
    items: [pct("particles.amount", "Amount", 0.02), pct("particles.opacity", "Opacity")],
    more: [num("particles.size", "Size", 0.2, 4, 0.05), num("particles.rise", "Rise height", 0.02, 0.5, 0.01), num("particles.drift", "Upward drift", 0, 0.4, 0.01), num("particles.speed", "Speed", 0.03, 1, 0.01)],
  },
  {
    title: "Atmosphere", group: "atmosphere", globeOnly: true,
    items: [{ type: "color", path: "atmosphere.color", label: "Glow colour" }, pct("atmosphere.strength", "Strength")],
    more: [num("atmosphere.size", "Size", 1.02, 1.5, 0.01)],
  },
  {
    title: "Arcs", group: "arcs",
    items: [
      { type: "colorset", fields: [{ path: "arcs.colors.0", label: "Start colour" }, { path: "arcs.colors.1", label: "End colour" }] },
      pct("arcs.opacity", "Opacity", 0.1),
      num("arcs.speed", "Speed", 0.2, 3, 0.05, "×"),
    ],
    more: [
      { type: "range", path: "arcs.thickness", label: "Thickness", min: 0.001, max: 0.012, step: 0.0002, scale: 1000 },
      num("arcs.height", "Height", 0.1, 1, 0.01),
      { type: "toggle", path: "arcs.icons.show", label: "Arc icons" },
      { type: "seg", path: "arcs.icons.style", label: "Style", options: ICON_STYLES, showIf: "arcs.icons.show" },
      { ...num("arcs.icons.size", "Size", 0.4, 3, 0.05, "×"), showIf: "arcs.icons.show" },
      { type: "toggle", path: "arcs.labels", label: "Route labels", globeOnly: true },
      { type: "routes", path: "arcs.routes" },
    ],
  },
  {
    title: "Markers", group: "markers",
    items: [
      { type: "color", path: "markers.color", label: "Colour" },
      { type: "seg", path: "markers.style", label: "Style", options: ICON_STYLES },
      num("markers.size", "Size", 0.4, 3, 0.05, "×"),
      num("markers.speed", "Timing", 0.25, 3, 0.05, "×"),
      num("markers.count", "At once", 1, 6, 1),
      { type: "toggle", path: "markers.labels", label: "Labels" },
      { type: "places", path: "markers.places" },
    ],
  },
  {
    title: "Globe body", globeOnly: true,
    items: [
      { type: "color", path: "globe.fill", label: "Fill" }, pct("globe.fillOpacity", "Fill opacity"),
      { type: "color", path: "rim.color", label: "Rim" }, pct("rim.strength", "Rim strength"),
    ],
  },
  {
    title: "Motion", globeOnly: true,
    items: [
      { type: "toggle", path: "rotation.auto", label: "Auto-rotate" },
      num("rotation.speed", "Speed", 0, 0.3, 0.005),
      { type: "seg", path: "rotation.startLongitude", label: "Start over", wrap: true, options: [[-55, "Americas"], [15, "Europe, Africa"], [80, "Asia"], [140, "Oceania"]] },
    ],
    more: [
      { type: "seg", path: "rotation.direction", label: "Direction", options: [[1, "Left to right"], [-1, "Right to left"]], wrap: true },
      num("rotation.startLongitude", "Longitude", -180, 180, 1, "°"),
      num("rotation.tilt", "Tilt", -1, 1, 0.01),
    ],
  },
]
const PROJECTION: SegRow = { type: "seg", path: "flat", label: "Projection", options: [[0, "Globe"], [1, "Flat map"]] }

// ---------- helpers ----------
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const get = (obj: any, path: string) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj)
function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split(".")
  let o = obj
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]]
  o[keys[keys.length - 1]] = value
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v)
function merge(base: any, patch: any): any {
  if (!isObj(base) || !isObj(patch)) return clone(patch)
  const out: any = clone(base)
  for (const k in patch) out[k] = isObj(out[k]) && isObj(patch[k]) ? merge(out[k], patch[k]) : clone(patch[k])
  return out
}
let theme: Theme = "light"
// The library's sample routes cross each other, so the demo starts from a generated set that doesn't.
const DEMO_ROUTES = demoRoutes()
const DEMO_DEFAULTS: GlobeOptions = merge(DEFAULT_OPTIONS, { arcs: { routes: DEMO_ROUTES } })
const resolve = (preset: Preset, t: Theme = theme): GlobeOptions => merge(merge(DEMO_DEFAULTS, preset.shared ?? {}), preset[t])
/** Drop every colour from an edits object (the shape `diff` returns). True if anything was dropped. */
function stripColours(e: any): boolean {
  let hit = false
  const del = (o: any, k: string) => {
    if (isObj(o) && k in o) {
      delete o[k]
      hit = true
    }
  }
  del(e, "colors")
  del(e, "background")
  for (const [g, k] of [["rim", "color"], ["arcs", "colors"], ["globe", "fill"], ["atmosphere", "color"], ["markers", "color"]] as const) {
    if (!isObj(e[g])) continue
    del(e[g], k)
    if (!Object.keys(e[g]).length) delete e[g]
  }
  return hit
}
/** Only what differs from `def`, for the copied snippet and the share link. */
function diff(cur: any, def: any): any {
  if (!isObj(cur) || !isObj(def)) return same(cur, def) ? undefined : cur
  const out: any = {}
  for (const k in cur) {
    if (k === "onReady") continue
    const d = diff(cur[k], def[k])
    if (d !== undefined) out[k] = d
  }
  return Object.keys(out).length ? out : undefined
}
const b64 = {
  enc: (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join("")),
  dec: (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))),
}
/** Readable JS object literal: short arrays stay on one line. */
function ser(v: any, pad = ""): string {
  if (Array.isArray(v)) {
    const flat = `[${v.map((x) => ser(x, pad)).join(", ")}]`
    if (!flat.includes("\n") && (flat.length <= 72 || v.every((x) => typeof x !== "object"))) return flat
    return `[\n${v.map((x) => `${pad}  ${ser(x, pad + "  ")}`).join(",\n")}\n${pad}]`
  }
  if (isObj(v)) {
    const flat = Object.keys(v).length <= 3 && Object.values(v).every((x) => typeof x !== "object" || (Array.isArray(x) && x.every((y) => typeof y !== "object")))
    const parts = Object.keys(v).map((k) => `${k}: ${ser(v[k], pad + "  ")}`)
    if (flat && parts.join(", ").length <= 60) return `{ ${parts.join(", ")} }`
    return `{\n${parts.map((p) => `${pad}  ${p}`).join(",\n")}\n${pad}}`
  }
  return JSON.stringify(v)
}

// ---------- colour parsing ----------
const probe = document.createElement("canvas").getContext("2d")
/** A hex string, "transparent", or any CSS colour that resolves to an opaque hex. Null if not a colour. */
function parseColour(raw: string): string | null {
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (v === "transparent") return v
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v)
  if (m) {
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
    return `#${h}`
  }
  if (!probe || !/^[a-z]+$|^(rgb|hsl)a?\(/.test(v)) return null
  probe.fillStyle = "#010203"
  probe.fillStyle = v
  const out = probe.fillStyle
  if (out === "#010203" && v !== "#010203") {
    probe.fillStyle = "#fefdfc"
    probe.fillStyle = v
    if (probe.fillStyle === "#fefdfc") return null
  }
  return /^#[0-9a-f]{6}$/.test(probe.fillStyle) ? probe.fillStyle : null
}

// ---------- state ----------
let presetName = "Stripe"
const docEl = document.documentElement
const systemDark = matchMedia("(prefers-color-scheme: dark)")
const isDark = () => (docEl.dataset.theme ? docEl.dataset.theme === "dark" : systemDark.matches)
let saved: any = {}
try {
  const h = decodeURIComponent(location.hash.slice(1))
  if (h) saved = JSON.parse(b64.dec(h)) ?? {}
} catch {
  /* ignore a bad link */
}
// A theme carried by a share link wins for this visit but is not saved as the visitor's choice.
if (saved.theme === "light" || saved.theme === "dark") docEl.dataset.theme = saved.theme
theme = isDark() ? "dark" : "light"
let base: GlobeOptions = resolve(PRESETS[0])
let state: GlobeOptions = clone(base)
const groupMemory: Partial<Record<Group, any>> = {}
/** Share links made before the arc icons were one group used `arcs.rings` and `arcs.ringSize`. */
function migrate(opts: any): any {
  const a = opts?.arcs
  if (!isObj(a) || !("rings" in a || "ringSize" in a)) return opts
  const { rings, ringSize, ...rest } = a
  const icons = { ...(isObj(rest.icons) ? rest.icons : {}) }
  if (typeof rings === "boolean") icons.show = rings
  if (typeof ringSize === "number") icons.size = ringSize
  return { ...opts, arcs: { ...rest, icons } }
}
const presetOf = (name: string) => PRESETS.find((p) => p.name === name) ?? PRESETS[0]

try {
  presetName = presetOf(saved.preset ?? presetName).name
  base = resolve(presetOf(presetName))
  state = merge(base, migrate(saved.options ?? {}))
} catch {
  /* ignore a bad link */
}

const stage = document.getElementById("stage")!
const globe = createParticleGlobe(stage, { ...state, flatTransition: 1200 })
if (!globe) stage.insertAdjacentHTML("beforeend", '<p class="err">This browser has no WebGL, so the globe can\'t draw here.</p>')
const push = (input: GlobeInput) => globe?.update(input)

const groupFallback = (g: Group): any =>
  g === "atmosphere"
    ? { color: presetOf(presetName).atmo[theme], strength: 0.2, size: 1.12 }
    : g === "markers"
      ? { ...clone(DEFAULT_MARKERS), color: get(base, "arcs.colors.1") ?? DEFAULT_MARKERS.color }
      : clone(DEMO_DEFAULTS[g])
/** The value a control returns to: the preset's, or the library default for a group the preset leaves off. */
function baseline(path: string, group?: Group): any {
  const v = get(base, path)
  if (v !== undefined || !group) return v
  return get({ [group]: groupFallback(group) }, path)
}
/** Current value, or what the control would start from while its group is switched off. */
const cur = (path: string, group?: Group) => get(state, path) ?? (group ? baseline(path, group) : undefined)
const modified = (path: string, group?: Group) => {
  if (group && !state[group]) return false
  const v = get(state, path)
  return v !== undefined && !same(v, baseline(path, group))
}

// ---------- icons ----------
const ic = (d: string, w = 12) => `<svg width="${w}" height="${w}" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
const CHEV = ic('<path d="M4.5 2.5 8 6 4.5 9.5"/>')
const RESET = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.6 7a4.4 4.4 0 1 0 1.4-3.2"/><path d="M2.4 1.8v2.6h2.6"/></svg>`
const SUN = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>`
const MOON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.4 9.6A5.6 5.6 0 0 1 6.4 2.6a5.6 5.6 0 1 0 7 7Z"/></svg>`

// ---------- colour picker ----------
type HSV = [number, number, number]
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
function hsv2hex([h, s, v]: HSV): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return "#" + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")
}
function hex2hsv(hex: string): HSV {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(hex)
  if (!m) return [0, 0, 1]
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, max ? d / max : 0, max]
}
const EYE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10.2 2.8 3 3M11.6 4.2 5 10.8l-.6 2.2-1.4.4.4-1.4 2.2-.6 6.6-6.6a1.4 1.4 0 0 0 0-2l-.6-.6a1.4 1.4 0 0 0-2 0Z"/></svg>`

const picker = (() => {
  const el = document.createElement("div")
  el.className = "picker"
  el.hidden = true
  el.setAttribute("role", "dialog")
  el.setAttribute("aria-label", "Colour picker")
  el.innerHTML = `<div class="pk-sv" tabindex="0" role="slider" aria-label="Saturation and brightness"><i class="pk-thumb"></i></div>
    <div class="pk-hue" tabindex="0" role="slider" aria-label="Hue" aria-valuemin="0" aria-valuemax="360"><i class="pk-thumb"></i></div>
    <div class="pk-row"><input class="pk-hex" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" maxlength="24" aria-label="Hex or CSS colour"><button type="button" class="pk-eye" title="Pick a colour from the screen" aria-label="Pick a colour from the screen" hidden>${EYE}</button></div>
    <div class="pk-quick" role="group" aria-label="Colours in this preset"></div>`
  document.body.appendChild(el)
  const sv = el.querySelector<HTMLElement>(".pk-sv")!
  const hue = el.querySelector<HTMLElement>(".pk-hue")!
  const hexIn = el.querySelector<HTMLInputElement>(".pk-hex")!
  const eye = el.querySelector<HTMLButtonElement>(".pk-eye")!
  const quick = el.querySelector<HTMLElement>(".pk-quick")!
  let hsv: HSV = [0, 0, 1]
  let anchor: HTMLElement | null = null
  let set: (v: string) => void = () => {}

  const paint = () => {
    const hex = hsv2hex(hsv)
    el.style.setProperty("--hue", `hsl(${hsv[0]} 100% 50%)`)
    el.style.setProperty("--picked", hex)
    sv.firstElementChild!.setAttribute("style", `left:${hsv[1] * 100}%;top:${(1 - hsv[2]) * 100}%`)
    hue.firstElementChild!.setAttribute("style", `left:${(hsv[0] / 360) * 100}%`)
    sv.setAttribute("aria-valuetext", `Saturation ${Math.round(hsv[1] * 100)}%, brightness ${Math.round(hsv[2] * 100)}%`)
    hue.setAttribute("aria-valuenow", String(Math.round(hsv[0])))
    if (document.activeElement !== hexIn) hexIn.value = hex
  }
  const emit = () => {
    paint()
    set(hsv2hex(hsv))
  }
  const place = () => {
    if (!anchor) return
    const r = anchor.getBoundingClientRect()
    const w = el.offsetWidth
    const h = el.offsetHeight
    const m = 8
    let top = r.bottom + 6
    if (top + h > innerHeight - m) top = r.top - h - 6 >= m ? r.top - h - 6 : Math.max(m, innerHeight - h - m)
    const left = Math.min(Math.max(m, r.right - w), Math.max(m, innerWidth - w - m))
    el.style.top = `${top}px`
    el.style.left = `${left}px`
  }
  const close = (refocus: boolean) => {
    if (el.hidden) return
    el.hidden = true
    const a = anchor
    anchor = null
    if (refocus) a?.focus()
  }
  const drag = (node: HTMLElement, move: (x: number, y: number, r: DOMRect) => void) => {
    const at = (e: PointerEvent) => {
      const r = node.getBoundingClientRect()
      move(clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height), r)
      emit()
    }
    node.addEventListener("pointerdown", (e) => {
      if (e.button) return
      e.preventDefault()
      node.focus()
      node.setPointerCapture(e.pointerId)
      at(e)
    })
    node.addEventListener("pointermove", (e) => {
      if (node.hasPointerCapture(e.pointerId)) at(e)
    })
  }
  drag(sv, (x, y) => {
    hsv[1] = x
    hsv[2] = 1 - y
  })
  drag(hue, (x) => {
    hsv[0] = x * 360
  })
  sv.addEventListener("keydown", (e) => {
    const k = e.shiftKey ? 0.1 : 0.01
    const d: Record<string, [number, number]> = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, k], ArrowDown: [0, -k] }
    if (!d[e.key]) return
    e.preventDefault()
    hsv = [hsv[0], clamp01(hsv[1] + d[e.key][0]), clamp01(hsv[2] + d[e.key][1])]
    emit()
  })
  hue.addEventListener("keydown", (e) => {
    const k = e.shiftKey ? 10 : 1
    const d: Record<string, number> = { ArrowLeft: -k, ArrowDown: -k, ArrowRight: k, ArrowUp: k }
    if (d[e.key] === undefined) return
    e.preventDefault()
    hsv = [Math.min(360, Math.max(0, hsv[0] + d[e.key])), hsv[1], hsv[2]]
    emit()
  })
  hexIn.addEventListener("input", () => {
    const c = parseColour(hexIn.value)
    hexIn.classList.toggle("bad", !c)
    if (!c) return
    hsv = hex2hsv(c)
    paint()
    set(c)
  })
  hexIn.addEventListener("blur", () => {
    hexIn.classList.remove("bad")
    hexIn.value = hsv2hex(hsv)
  })
  hexIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") hexIn.blur()
  })
  const Eye = (window as any).EyeDropper
  if (Eye) {
    eye.hidden = false
    eye.addEventListener("click", () => {
      new Eye().open().then(
        (r: { sRGBHex: string }) => {
          hsv = hex2hsv(r.sRGBHex.toLowerCase())
          emit()
        },
        () => {},
      )
    })
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.hidden) {
      e.preventDefault()
      close(true)
    }
  })
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as Node
    if (!el.hidden && !el.contains(t) && !anchor?.contains(t)) close(false)
  }, true)
  el.addEventListener("focusout", (e) => {
    const n = e.relatedTarget as Node | null
    if (n && !el.contains(n) && n !== anchor) close(false)
  })
  addEventListener("resize", place)
  document.getElementById("scroll")!.addEventListener("scroll", () => {
    if (!anchor) return
    const a = anchor.getBoundingClientRect()
    const s = document.getElementById("scroll")!.getBoundingClientRect()
    if (a.bottom < s.top || a.top > s.bottom) close(false)
    else place()
  }, { passive: true })

  return {
    get anchor() { return anchor },
    open(a: HTMLElement, value: string, onSet: (v: string) => void) {
      anchor = a
      set = onSet
      hsv = hex2hsv(parseColour(value) ?? "#ffffff")
      const p = resolve(presetOf(presetName))
      const quickColours = [...p.colors, p.background, p.rim.color, p.globe.fill, ...(p.arcs ? p.arcs.colors : [])]
        .map((c) => parseColour(c))
        .filter((c, i, all): c is string => !!c && c !== "transparent" && all.indexOf(c) === i)
      quick.replaceChildren(...quickColours.map((c) => {
        const b = document.createElement("button")
        b.type = "button"
        b.className = "pk-q"
        b.style.setProperty("--c", c)
        b.title = c
        b.setAttribute("aria-label", `Use ${c}`)
        b.addEventListener("click", () => {
          hsv = hex2hsv(c)
          emit()
        })
        return b
      }))
      quick.hidden = !quickColours.length
      el.hidden = false
      paint()
      place()
      sv.focus({ preventScroll: true })
    },
    /** The value changed from outside (typed hex, reset, preset): follow it unless it is what the picker just sent. */
    sync(a: HTMLElement, value: string) {
      if (a !== anchor || el.hidden) return
      const c = parseColour(value)
      if (c && c !== "transparent" && c !== hsv2hex(hsv)) {
        hsv = hex2hsv(c)
        paint()
      }
    },
    close,
  }
})()

// ---------- controls ----------
const sync: Array<() => void> = []
let uid = 0

function commit(path: string, value: unknown, group?: Group) {
  if (group && !state[group]) return
  setPath(state, path, value)
  const top = path.split(".")[0] as keyof GlobeOptions
  push({ [top]: clone((state as any)[top]) } as GlobeInput)
  refresh()
}
function resetPath(path: string, group?: Group) {
  const v = baseline(path, group)
  if (v !== undefined) commit(path, clone(v), group)
}

function segControl(r: SegRow, group?: Group): HTMLElement {
  const seg = document.createElement("div")
  seg.className = "seg" + (r.wrap ? " wrap" : "")
  seg.setAttribute("role", "group")
  seg.setAttribute("aria-label", r.label)
  const btns = r.options.map(([v, l]) => {
    const b = document.createElement("button")
    b.type = "button"
    b.textContent = l
    b.addEventListener("click", () => commit(r.path, v, group))
    seg.appendChild(b)
    return [b, v] as const
  })
  sync.push(() => btns.forEach(([b, v]) => b.setAttribute("aria-pressed", String(get(state, r.path) === v))))
  return seg
}

function dotReset(path: string, label: string, group?: Group): HTMLButtonElement {
  const b = document.createElement("button")
  b.type = "button"
  b.className = "dot-reset"
  b.disabled = true
  b.title = `Reset ${label.toLowerCase()} to the preset value`
  b.setAttribute("aria-label", b.title)
  b.addEventListener("click", () => resetPath(path, group))
  sync.push(() => {
    b.disabled = !modified(path, group)
  })
  return b
}

function colourField(path: string, label: string, group?: Group): HTMLElement {
  const wrap = document.createElement("span")
  wrap.className = "cfield"
  wrap.innerHTML = `<button type="button" class="swatch" title="Pick a colour" aria-haspopup="dialog" aria-label="${label}: open colour picker"><i></i></button><input class="hex" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" maxlength="24" aria-label="${label} colour, hex or CSS colour">`
  const pick = wrap.querySelector<HTMLButtonElement>(".swatch")!
  const hex = wrap.querySelector<HTMLInputElement>(".hex")!
  const chip = wrap.querySelector<HTMLElement>("i")!
  pick.addEventListener("click", () => {
    if (picker.anchor === pick) picker.close(false)
    else picker.open(pick, String(cur(path, group) ?? "#ffffff"), (v) => commit(path, v, group))
  })
  hex.addEventListener("input", () => {
    const c = parseColour(hex.value)
    wrap.classList.toggle("bad", !c)
    if (c) commit(path, c, group)
  })
  hex.addEventListener("blur", () => {
    wrap.classList.remove("bad")
    hex.value = String(cur(path, group) ?? "")
  })
  hex.addEventListener("keydown", (e) => {
    if (e.key === "Enter") hex.blur()
  })
  sync.push(() => {
    const v = cur(path, group)
    if (v === undefined) return
    chip.style.setProperty("--c", v)
    picker.sync(pick, v)
    if (document.activeElement !== hex || parseColour(hex.value) !== parseColour(v)) hex.value = v
  })
  return wrap
}

function rangeRow(r: RangeRow, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "row row-range"
  const id = `c${uid++}`
  const scale = r.scale ?? 1
  const st = r.step * scale
  const dec = st >= 1 ? 0 : Math.ceil(-Math.log10(st) - 1e-9)
  const show = (v: number) => (v * scale).toFixed(dec)
  el.appendChild(dotReset(r.path, r.label, group))
  el.insertAdjacentHTML(
    "beforeend",
    `<label for="${id}">${r.label}</label><input class="slider" id="${id}" type="range" min="${r.min}" max="${r.max}" step="${r.step}"><span class="num"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${r.label} value">${r.unit ? `<span class="unit" aria-hidden="true">${r.unit}</span>` : ""}</span>`,
  )
  const slider = el.querySelector<HTMLInputElement>(".slider")!
  const box = el.querySelector<HTMLElement>(".num")!
  const field = box.querySelector<HTMLInputElement>("input")!
  const put = (v: number) => {
    const c = Math.min(r.max, Math.max(r.min, v))
    commit(r.path, +c.toFixed(6), group)
  }
  slider.addEventListener("input", () => commit(r.path, parseFloat(slider.value), group))
  const fromField = () => {
    const n = parseFloat(field.value.replace(",", "."))
    if (Number.isNaN(n)) return false
    put(n / scale)
    return true
  }
  field.addEventListener("change", () => {
    box.classList.toggle("bad", !fromField())
  })
  field.addEventListener("input", () => box.classList.remove("bad"))
  field.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (!fromField()) box.classList.add("bad")
      field.select()
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      put((cur(r.path, group) as number) + (e.key === "ArrowUp" ? 1 : -1) * r.step * (e.shiftKey ? 10 : 1))
    } else if (e.key === "Escape") {
      field.value = show(cur(r.path, group))
      box.classList.remove("bad")
    }
  })
  field.addEventListener("blur", () => {
    const v = cur(r.path, group)
    if (v !== undefined) field.value = show(v)
    box.classList.remove("bad")
  })
  sync.push(() => {
    el.hidden = (!!r.globeOnly && !!state.flat) || (!!r.showIf && !cur(r.showIf, group))
    const v = cur(r.path, group)
    if (v === undefined) return
    slider.value = String(v)
    slider.style.setProperty("--fill", `${((v - r.min) / (r.max - r.min)) * 100}%`)
    if (document.activeElement !== field) field.value = show(v)
  })
  return el
}

function colorRow(r: ColorRow, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "row row-color"
  const id = `c${uid++}`
  el.appendChild(dotReset(r.path, r.label, group))
  el.insertAdjacentHTML("beforeend", `<label id="${id}">${r.label}</label><span class="control-end"></span>`)
  el.querySelector(".control-end")!.appendChild(colourField(r.path, r.label, group))
  return el
}

function toggleRow(r: ToggleRow, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "row row-toggle"
  const id = `c${uid++}`
  el.appendChild(dotReset(r.path, r.label, group))
  el.insertAdjacentHTML("beforeend", `<label for="${id}">${r.label}</label><span class="control-end"><span class="switch"><input id="${id}" type="checkbox" role="switch"><span class="track"></span></span></span>`)
  const inp = el.querySelector("input")!
  inp.addEventListener("change", () => commit(r.path, inp.checked, group))
  sync.push(() => {
    el.hidden = !!r.globeOnly && !!state.flat
    inp.checked = !!cur(r.path, group)
  })
  return el
}

function segRow(r: SegRow, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "row row-seg"
  el.appendChild(dotReset(r.path, r.label, group))
  el.insertAdjacentHTML("beforeend", `<span class="label">${r.label}</span>`)
  el.appendChild(segControl(r, group))
  if (r.showIf) sync.push(() => { el.hidden = !cur(r.showIf!, group) })
  return el
}

const REGION_NAMES = Object.keys(REGIONS) as RegionName[]
let customView = { lat: 35, lon: 105, zoom: 4 }
/** Region buttons, plus a Custom button that opens a small popover for latitude, longitude and zoom. */
function regionRow(r: RegionRow): HTMLElement {
  const el = document.createElement("div")
  el.className = "row-region"
  el.innerHTML = `<div class="seg wrap three" role="group" aria-label="Region"></div>
    <p class="help">Fly the camera to a region. Works on the globe and the flat map.</p>`
  const seg = el.querySelector<HTMLElement>(".seg")!
  const btns = REGION_NAMES.map((name) => {
    const b = document.createElement("button")
    b.type = "button"
    b.textContent = REGIONS[name].label
    b.addEventListener("click", () => {
      pop.close(false)
      commit(r.path, name === "world" ? null : name)
    })
    seg.appendChild(b)
    return [b, name] as const
  })
  const custom = document.createElement("button")
  custom.type = "button"
  custom.textContent = "Custom"
  custom.setAttribute("aria-haspopup", "dialog")
  seg.appendChild(custom)

  const pop = (() => {
    const box = document.createElement("div")
    box.className = "picker focus-pop"
    box.hidden = true
    box.setAttribute("role", "dialog")
    box.setAttribute("aria-label", "Custom view")
    const field = (key: string, label: string, min: number, max: number, step: number) =>
      `<label class="fp-field"><span>${label}</span><input data-k="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" autocomplete="off"></label>`
    box.innerHTML = `<div class="fp-grid">${field("lat", "Latitude", -90, 90, 1)}${field("lon", "Longitude", -180, 180, 1)}${field("zoom", "Zoom", 1, 16, 0.5)}</div>
      <p class="help">Zoom 1 is the whole world. Each step shows a smaller slice.</p>`
    document.body.appendChild(box)
    const inputs = Array.from(box.querySelectorAll<HTMLInputElement>("input"))
    const place = () => {
      const a = custom.getBoundingClientRect()
      const w = box.offsetWidth
      const h = box.offsetHeight
      const m = 8
      let top = a.bottom + 6
      if (top + h > innerHeight - m) top = a.top - h - 6 >= m ? a.top - h - 6 : Math.max(m, innerHeight - h - m)
      box.style.top = `${top}px`
      box.style.left = `${Math.min(Math.max(m, a.right - w), Math.max(m, innerWidth - w - m))}px`
    }
    const close = (refocus: boolean) => {
      if (box.hidden) return
      box.hidden = true
      custom.setAttribute("aria-expanded", "false")
      if (refocus) custom.focus()
    }
    const range: Record<string, [number, number]> = { lat: [-90, 90], lon: [-180, 180], zoom: [1, 16] }
    inputs.forEach((i) =>
      i.addEventListener("input", () => {
        const v = inputs.map((x) => parseFloat(x.value))
        i.classList.toggle("bad", Number.isNaN(parseFloat(i.value)))
        if (v.some(Number.isNaN)) return
        const [lat, lon, zoom] = inputs.map((x, n) => Math.min(range[x.dataset.k!][1], Math.max(range[x.dataset.k!][0], v[n])))
        customView = { lat, lon, zoom }
        commit(r.path, { ...customView })
      }),
    )
    box.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close(true)
      }
    })
    document.addEventListener("pointerdown", (e) => {
      const t = e.target as Node
      if (!box.hidden && !box.contains(t) && !custom.contains(t)) close(false)
    }, true)
    addEventListener("resize", () => !box.hidden && place())
    document.getElementById("scroll")!.addEventListener("scroll", () => close(false), { passive: true })
    return {
      get open() { return !box.hidden },
      show() {
        const f = get(state, r.path)
        if (isObj(f)) customView = { lat: f.lat, lon: f.lon, zoom: f.zoom }
        else commit(r.path, { ...customView })
        inputs.forEach((i) => (i.value = String(customView[i.dataset.k as "lat"])))
        box.hidden = false
        custom.setAttribute("aria-expanded", "true")
        place()
        inputs[0].focus({ preventScroll: true })
      },
      close,
    }
  })()
  custom.addEventListener("click", () => (pop.open ? pop.close(false) : pop.show()))

  sync.push(() => {
    const f = get(state, r.path)
    const active = isObj(f) ? "custom" : (f ?? "world")
    btns.forEach(([b, name]) => b.setAttribute("aria-pressed", String(name === active)))
    custom.setAttribute("aria-pressed", String(active === "custom"))
  })
  return el
}

function colorSet(s: ColorSet, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "colorset"
  if (s.bar) {
    const bar = document.createElement("div")
    bar.className = "gradient-bar"
    el.appendChild(bar)
    sync.push(() => {
      const [a, b, c] = state.colors
      bar.style.background = `linear-gradient(90deg, ${a}, ${b} ${Math.round(state.gradientMid * 100)}%, ${c})`
    })
  }
  for (const f of s.fields) el.appendChild(colorRow({ type: "color", path: f.path, label: f.label }, group))
  return el
}

// ---------- arc routes: "lat, lon > lat, lon  optional label" ----------
const N = "(-?\\d+(?:\\.\\d+)?)"
const LEFT = new RegExp(`^${N}[\\s,]+${N}$`)
const RIGHT = new RegExp(`^${N}[\\s,]+${N}(?:[\\s,]+(.+))?$`)
function parseRoutes(text: string): { routes: ArcRoute[]; error?: string } {
  const routes: ArcRoute[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("#")) continue
    const parts = line.split(/\s*(?:->|=>|→|>)\s*/)
    const a = parts.length === 2 ? LEFT.exec(parts[0]) : null
    const b = parts.length === 2 ? RIGHT.exec(parts[1]) : null
    if (!a || !b) return { routes, error: `Line ${i + 1}: use  lat, lon > lat, lon  label` }
    const [la, lo, la2, lo2] = [+a[1], +a[2], +b[1], +b[2]]
    if (Math.abs(la) > 90 || Math.abs(la2) > 90) return { routes, error: `Line ${i + 1}: latitude runs from -90 to 90` }
    if (Math.abs(lo) > 180 || Math.abs(lo2) > 180) return { routes, error: `Line ${i + 1}: longitude runs from -180 to 180` }
    const route: ArcRoute = { from: [la, lo], to: [la2, lo2] }
    if (b[3]) route.label = b[3].trim()
    routes.push(route)
  }
  return routes.length ? { routes } : { routes, error: "Add at least one route" }
}
const routeLines = (rs: ArcRoute[]) => rs.map((r) => `${r.from[0]}, ${r.from[1]} > ${r.to[0]}, ${r.to[1]}${r.label ? "  " + r.label : ""}`).join("\n")

function routesEditor(r: Routes, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "routes"
  const id = `c${uid++}`
  el.innerHTML = `<div class="routes-head"><label for="${id}">Routes</label><span><small class="count"></small> <button type="button" class="link-btn">Use preset routes</button></span></div>
    <div class="routes-count"><input class="slider" type="range" min="1" max="1" step="1" aria-label="Number of routes" aria-describedby="${id}-n"><span class="num"><input type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="Number of routes value"></span></div>
    <p class="help" id="${id}-n">More routes are added so none cross, on the globe or the flat map. Fewer removes from the end.</p>
    <textarea id="${id}" spellcheck="false" autocomplete="off" wrap="off" aria-describedby="${id}-h"></textarea>
    <p class="help" id="${id}-h">One per line: <code>lat, lon &gt; lat, lon  label</code>. The label is optional and shows at the destination when Route labels is on.</p>
    <p class="err-line" role="alert" hidden></p>`
  const ta = el.querySelector("textarea")!
  const err = el.querySelector<HTMLElement>(".err-line")!
  const count = el.querySelector(".count")!
  const useDefault = el.querySelector<HTMLButtonElement>(".link-btn")!
  const slider = el.querySelector<HTMLInputElement>(".routes-count .slider")!
  const numBox = el.querySelector<HTMLElement>(".routes-count .num")!
  const numIn = numBox.querySelector<HTMLInputElement>("input")!
  let max = 1
  let fillTimer = 0
  const setCount = (n: number) => {
    const have = get(state, r.path) as ArcRoute[] | undefined
    if (!have) return
    const want = Math.min(max, Math.max(1, Math.round(n)))
    if (want === have.length) return
    commit(r.path, clone(want < have.length ? have.slice(0, want) : have.concat(fillCached(have).slice(0, want - have.length))), group)
  }
  slider.addEventListener("input", () => setCount(parseFloat(slider.value)))
  numIn.addEventListener("change", () => {
    const n = parseFloat(numIn.value)
    numBox.classList.toggle("bad", Number.isNaN(n))
    if (!Number.isNaN(n)) setCount(n)
    numIn.value = String(((get(state, r.path) as ArcRoute[]) ?? []).length)
  })
  numIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") numIn.blur()
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      setCount(((get(state, r.path) as ArcRoute[]) ?? []).length + (e.key === "ArrowUp" ? 1 : -1))
    }
  })
  let timer = 0
  const apply = () => {
    const res = parseRoutes(ta.value)
    err.hidden = !res.error
    err.textContent = res.error ?? ""
    ta.setAttribute("aria-invalid", String(!!res.error))
    if (!res.error) commit(r.path, res.routes, group)
  }
  ta.addEventListener("input", () => {
    clearTimeout(timer)
    timer = window.setTimeout(apply, 250)
  })
  ta.addEventListener("blur", () => {
    if (!err.hidden) {
      ta.value = routeLines(get(state, r.path))
      err.hidden = true
    }
  })
  useDefault.addEventListener("click", () => {
    resetPath(r.path, group)
    ta.value = routeLines(get(state, r.path))
    err.hidden = true
  })
  sync.push(() => {
    const v = cur(r.path, group) as ArcRoute[] | undefined
    if (!v) return
    count.textContent = `${v.length} route${v.length === 1 ? "" : "s"}`
    // How many fit is worked out once, off the main path, then follows the slider for free.
    const known = peekFill(v)
    if (!known && !fillTimer) {
      fillTimer = window.setTimeout(() => {
        fillTimer = 0
        const now = get(state, r.path) as ArcRoute[] | undefined
        if (now && !peekFill(now)) {
          fillCached(now)
          refresh()
        }
      }, 30)
    }
    max = Math.max(1, v.length + (known ? known.length : 0))
    slider.max = String(max)
    slider.value = String(v.length)
    slider.style.setProperty("--fill", `${max > 1 ? ((v.length - 1) / (max - 1)) * 100 : 100}%`)
    if (document.activeElement !== numIn) numIn.value = String(v.length)
    useDefault.hidden = !modified(r.path, group)
    if (document.activeElement !== ta) ta.value = routeLines(v)
  })
  return el
}

// ---------- marker places: "lat, lon  label" ----------
function parsePlaces(text: string): { places: MarkerPlace[]; error?: string } {
  const places: MarkerPlace[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("#")) continue
    const m = RIGHT.exec(line)
    if (!m) return { places, error: `Line ${i + 1}: use  lat, lon  label` }
    const [la, lo] = [+m[1], +m[2]]
    if (Math.abs(la) > 90) return { places, error: `Line ${i + 1}: latitude runs from -90 to 90` }
    if (Math.abs(lo) > 180) return { places, error: `Line ${i + 1}: longitude runs from -180 to 180` }
    const p: MarkerPlace = { lat: la, lon: lo }
    if (m[3]) p.label = m[3].trim()
    places.push(p)
  }
  return places.length ? { places } : { places, error: "Add at least one place" }
}
const placeLines = (ps: MarkerPlace[]) => ps.map((p) => `${p.lat}, ${p.lon}${p.label ? "  " + p.label : ""}`).join("\n")

function placesEditor(r: Places, group?: Group): HTMLElement {
  const el = document.createElement("div")
  el.className = "routes"
  const id = `c${uid++}`
  el.innerHTML = `<div class="routes-head"><label for="${id}">Places</label><span><small class="count"></small> <button type="button" class="link-btn">Use preset places</button></span></div>
    <textarea id="${id}" spellcheck="false" autocomplete="off" wrap="off" aria-describedby="${id}-h"></textarea>
    <p class="help" id="${id}-h">One per line: <code>lat, lon  label</code>. Markers appear one after another, skipping places on the far side of the globe.</p>
    <p class="err-line" role="alert" hidden></p>`
  const ta = el.querySelector("textarea")!
  const err = el.querySelector<HTMLElement>(".err-line")!
  const count = el.querySelector(".count")!
  const useDefault = el.querySelector<HTMLButtonElement>(".link-btn")!
  let timer = 0
  ta.addEventListener("input", () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      const res = parsePlaces(ta.value)
      err.hidden = !res.error
      err.textContent = res.error ?? ""
      ta.setAttribute("aria-invalid", String(!!res.error))
      if (!res.error) commit(r.path, res.places, group)
    }, 250)
  })
  ta.addEventListener("blur", () => {
    if (!err.hidden) {
      ta.value = placeLines(get(state, r.path))
      err.hidden = true
    }
  })
  useDefault.addEventListener("click", () => {
    commit(r.path, clone(DEFAULT_MARKERS.places), group)
    ta.value = placeLines(get(state, r.path))
    err.hidden = true
  })
  sync.push(() => {
    const v = cur(r.path, group) as MarkerPlace[] | undefined
    if (!v) return
    count.textContent = `${v.length} place${v.length === 1 ? "" : "s"}`
    useDefault.hidden = same(v, DEFAULT_MARKERS.places)
    if (document.activeElement !== ta) ta.value = placeLines(v)
  })
  return el
}

function build(item: Item, group?: Group): HTMLElement {
  switch (item.type) {
    case "range": return rangeRow(item, group)
    case "color": return colorRow(item, group)
    case "toggle": return toggleRow(item, group)
    case "seg": return segRow(item, group)
    case "colorset": return colorSet(item, group)
    case "routes": return routesEditor(item, group)
    case "places": return placesEditor(item, group)
    case "region": return regionRow(item)
  }
}
const pathsOf = (items: Item[]): string[] =>
  items.flatMap((i) => (i.type === "colorset" ? i.fields.map((f) => f.path) : [i.path]))

// ---------- panel ----------
const presetsEl = document.getElementById("presets")!
for (const p of PRESETS) {
  const b = document.createElement("button")
  b.type = "button"
  b.className = "preset"
  b.dataset.name = p.name
  b.innerHTML = `<span class="chip"></span><span>${p.name}</span>`
  b.addEventListener("click", () => {
    loadPreset(p.name)
    presetsEl.scrollTo({ left: b.offsetLeft - 16, behavior: "smooth" })
  })
  presetsEl.appendChild(b)
}
/** Preset chips show the look for the current theme, so a dark preset never vanishes into a dark panel. */
const paintChips = () =>
  document.querySelectorAll<HTMLElement>(".preset").forEach((b) => {
    const p = presetOf(b.dataset.name!)
    b.querySelector<HTMLElement>(".chip")!.style.background = `linear-gradient(135deg,${(p.swatchAlt?.[theme] ?? p.swatch).join(",")})`
  })
paintChips()
document.getElementById("projection")!.appendChild(segControl(PROJECTION))
const centreBox = document.getElementById("map-centre")!
centreBox.appendChild(rangeRow(num("flatCentre", "Map centre", -180, 180, 1, "°")))

const sectionsEl = document.getElementById("sections")!
const setOpen = (collapse: HTMLElement, btn: HTMLElement, open: boolean) => {
  collapse.dataset.open = String(open)
  btn.setAttribute("aria-expanded", String(open))
  collapse.firstElementChild!.toggleAttribute("inert", !open)
}

for (const sec of SECTIONS) {
  const g = sec.group
  const key = `s${uid++}`
  const root = document.createElement("section")
  root.className = "section"
  root.innerHTML = `<div class="sec-bar"><button type="button" class="sec-toggle" aria-controls="${key}">${CHEV.replace("<svg", '<svg class="chev"')}<span class="sec-title">${sec.title}</span></button><button type="button" class="mini-reset" hidden title="Reset ${sec.title.toLowerCase()} to the preset" aria-label="Reset ${sec.title.toLowerCase()} to the preset">${RESET}</button></div>
    <div class="collapse" id="${key}"><div class="inner"><div class="rows"></div></div></div>`
  const toggle = root.querySelector<HTMLButtonElement>(".sec-toggle")!
  const collapse = root.querySelector<HTMLElement>(".collapse")!
  const inner = collapse.querySelector<HTMLElement>(".inner")!
  const rows = inner.querySelector<HTMLElement>(".rows")!
  const miniReset = root.querySelector<HTMLButtonElement>(".mini-reset")!
  toggle.addEventListener("click", () => setOpen(collapse, toggle, collapse.dataset.open !== "true"))

  if (g) {
    const bar = root.querySelector(".sec-bar")!
    const sw = document.createElement("label")
    sw.className = "switch"
    sw.title = `Turn ${sec.title.toLowerCase()} on or off`
    sw.innerHTML = `<input type="checkbox" role="switch" aria-label="${sec.title} on or off"><span class="track"></span>`
    const box = sw.querySelector("input")!
    box.addEventListener("change", () => {
      const cur = state[g]
      if (box.checked && !cur) {
        ;(state as any)[g] = groupMemory[g] ? merge(isObj(base[g]) ? base[g] : groupFallback(g), groupMemory[g]) : clone(isObj(base[g]) ? base[g] : groupFallback(g))
      } else if (!box.checked && cur) {
        groupMemory[g] = clone(cur)
        ;(state as any)[g] = false
      }
      push({ [g]: state[g] } as GlobeInput)
      if (box.checked) setOpen(collapse, toggle, true)
      refresh()
    })
    bar.appendChild(sw)
    sync.push(() => {
      box.checked = !!state[g]
      root.classList.toggle("off", !state[g])
      rows.toggleAttribute("inert", !state[g])
      root.querySelector(".more-wrap")?.toggleAttribute("inert", !state[g])
    })
  }

  for (const it of sec.items) rows.appendChild(build(it, g))

  const allPaths = pathsOf([...sec.items, ...(sec.more ?? [])])
  if (sec.more) {
    const mid = `${key}m`
    const more = document.createElement("div")
    more.className = "more-wrap"
    more.innerHTML = `<button type="button" class="more-btn" aria-expanded="false" aria-controls="${mid}">${CHEV.replace("<svg", '<svg class="chev"')}<span>More options</span><span class="count"></span></button>
      <div class="collapse" id="${mid}" data-open="false"><div class="inner" inert><div class="rows"></div></div></div>`
    const mBtn = more.querySelector<HTMLButtonElement>(".more-btn")!
    const mCol = more.querySelector<HTMLElement>(".collapse")!
    const mRows = more.querySelector<HTMLElement>(".rows")!
    const mCount = more.querySelector(".count")!
    for (const it of sec.more) mRows.appendChild(build(it, g))
    mBtn.addEventListener("click", () => setOpen(mCol, mBtn, mCol.dataset.open !== "true"))
    const morePaths = pathsOf(sec.more)
    sync.push(() => {
      const n = morePaths.filter((p) => modified(p, g)).length
      mCount.textContent = n ? `${n} changed` : ""
    })
    inner.appendChild(more)
  }

  // Atmosphere and globe body fade out completely on the flat map, so their controls step aside. Values are untouched.
  if (sec.globeOnly) sync.push(() => { root.hidden = !!state.flat })
  const groupDiffers = () => !!g && !!state[g] !== !!base[g]
  sync.push(() => {
    miniReset.hidden = !(groupDiffers() || allPaths.some((p) => modified(p, g)))
  })
  miniReset.addEventListener("click", () => {
    if (g) {
      ;(state as any)[g] = clone(base[g])
      delete groupMemory[g]
      push({ [g]: state[g] } as GlobeInput)
    } else {
      for (const p of allPaths) {
        const v = baseline(p)
        if (v !== undefined) setPath(state, p, clone(v))
      }
      for (const top of new Set(allPaths.map((p) => p.split(".")[0]))) push({ [top]: clone((state as any)[top]) } as GlobeInput)
    }
    refresh()
  })

  setOpen(collapse, toggle, !!sec.open)
  sectionsEl.appendChild(root)
}

// ---------- refresh, presets, share state ----------
const editedPill = document.getElementById("modified")!
const hintEl = document.querySelector<HTMLElement>(".hint")!
function refresh() {
  sync.forEach((f) => f())
  document.querySelectorAll<HTMLButtonElement>(".preset").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.name === presetName)))
  centreBox.hidden = !state.flat
  hintEl.hidden = !!state.flat || !!state.focus
  const ref = { ...base, flat: state.flat, flatCentre: state.flatCentre }
  editedPill.hidden = diff(state, ref) === undefined
  history.replaceState(null, "", `#${encodeURIComponent(b64.enc(JSON.stringify({ preset: presetName, theme, options: diff(state, base) ?? {} })))}`)
}

function loadPreset(name: string) {
  picker.close(false)
  presetName = name
  const { flat, flatCentre } = state
  base = resolve(presetOf(name))
  state = { ...clone(base), flat, flatCentre }
  for (const k of Object.keys(groupMemory)) delete groupMemory[k as Group]
  push(state)
  refresh()
}

// ---------- header, theme, actions ----------
const toast = document.getElementById("toast")!
let toastTimer = 0
const flash = (m: string) => {
  toast.textContent = m
  toast.classList.add("on")
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove("on"), 2200)
}
const copy = (text: string, done: string) =>
  (navigator.clipboard?.writeText(text) ?? Promise.reject()).then(
    () => flash(done),
    () => flash("Couldn't reach the clipboard. Select the text instead."),
  )

const themeBtn = document.getElementById("theme")!
const paintTheme = () => {
  themeBtn.innerHTML = isDark() ? SUN : MOON
  const label = isDark() ? "Switch to light theme" : "Switch to dark theme"
  themeBtn.title = label
  themeBtn.setAttribute("aria-label", label)
}
/** Re-skin the globe for the current theme. Non-colour edits (projection, centre, routes, tweaks) carry over; edited colours reset. */
function retheme() {
  paintTheme()
  const next: Theme = isDark() ? "dark" : "light"
  if (next === theme) return
  picker.close(false)
  const edits = diff(state, base) ?? {}
  const hadColours = stripColours(edits)
  theme = next
  paintChips()
  base = resolve(presetOf(presetName))
  state = merge(base, edits)
  if (isObj(state.atmosphere) && !(state.atmosphere as any).color) state.atmosphere = merge(groupFallback("atmosphere"), state.atmosphere)
  for (const g of Object.keys(groupMemory) as Group[]) {
    const m = groupMemory[g]
    if (isObj(m)) {
      delete m.colors
      delete m.color
    }
  }
  push(state)
  refresh()
  if (hadColours) flash(`Colours reset to the ${theme} look`)
}
themeBtn.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark"
  docEl.dataset.theme = next
  try {
    localStorage.setItem("pg-theme", next)
  } catch {
    /* private mode */
  }
  retheme()
})
// With no saved or shared choice the page follows the system setting, live.
systemDark.addEventListener("change", () => {
  if (!docEl.dataset.theme) retheme()
  else paintTheme()
})
paintTheme()

document.getElementById("copy-install")!.addEventListener("click", () => copy("npm i particle-globe", "Install command copied"))
document.getElementById("copy-code")!.addEventListener("click", () => {
  const opts = diff(state, DEFAULT_OPTIONS) ?? {}
  if (isObj(state.markers)) opts.markers = diff(state.markers, DEFAULT_MARKERS) ?? {}
  const body = Object.keys(opts).length ? ser(opts) : "{}"
  copy(`import { createParticleGlobe } from "particle-globe"\n\ncreateParticleGlobe(document.getElementById("globe"), ${body})\n`, "Code copied")
})
document.getElementById("copy-link")!.addEventListener("click", () => copy(location.href, "Link copied"))
document.getElementById("reset")!.addEventListener("click", () => {
  loadPreset(presetName)
  flash("Back to the " + presetName + " preset")
})

refresh()
