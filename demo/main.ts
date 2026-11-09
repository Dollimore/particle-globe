import { createParticleGlobe, DEFAULT_OPTIONS, type GlobeInput, type GlobeOptions } from "../src/index"

// ---------- presets ----------
type Preset = { name: string; swatch: [string, string, string]; page: "light" | "dark"; options: GlobeInput }
const PRESETS: Preset[] = [
  { name: "Stripe", swatch: ["#6b54f5", "#db61db", "#eb4d54"], page: "light", options: { background: "#ffffff" } },
  {
    name: "Midnight",
    swatch: ["#3b82f6", "#22d3ee", "#a78bfa"],
    page: "dark",
    options: {
      colors: ["#3b82f6", "#22d3ee", "#a78bfa"], gradientAngle: 90,
      dots: { highlight: 0.4, intensity: 1.1, farSide: 0.45 },
      rim: { color: "#3b5bdb", strength: 0.8 },
      arcs: { colors: ["#22d3ee", "#f0abfc"] },
      globe: { fill: "#0b1224", fillOpacity: 0.9 }, background: "#070b16",
    },
  },
  {
    name: "Emerald",
    swatch: ["#0f5132", "#1d7a49", "#4cc283"],
    page: "light",
    options: {
      colors: ["#0f5132", "#1d7a49", "#4cc283"], gradientAngle: 70, dots: { highlight: 0.6 },
      rim: { color: "#dcefe3" }, arcs: { colors: ["#1d7a49", "#a3e635"] }, background: "#f4f6f2",
    },
  },
  {
    name: "Mono",
    swatch: ["#111827", "#111827", "#111827"],
    page: "light",
    options: {
      colors: ["#111827", "#111827", "#111827"], dots: { highlight: 0.65, twinkle: 0.15 },
      rim: { color: "#f1f2f4" }, arcs: { colors: ["#111827", "#111827"], opacity: 0.85 }, background: "#ffffff",
    },
  },
  {
    name: "Sunset",
    swatch: ["#f97316", "#ec4899", "#fde047"],
    page: "dark",
    options: {
      colors: ["#f97316", "#ec4899", "#fde047"], gradientAngle: 120, dots: { highlight: 0.35, farSide: 0.4 },
      rim: { color: "#7c2d12", strength: 0.7 }, arcs: { colors: ["#fde047", "#fb7185"] },
      globe: { fill: "#20121a", fillOpacity: 0.92 }, background: "#1a0f14",
    },
  },
  {
    name: "Ice",
    swatch: ["#94a3b8", "#60a5fa", "#e0f2fe"],
    page: "light",
    options: {
      colors: ["#94a3b8", "#60a5fa", "#e0f2fe"], gradientAngle: 200,
      dots: { highlight: 0.5, intensity: 1.2, size: 1.3, density: 0.8 },
      rim: { color: "#dbeafe" }, arcs: { colors: ["#38bdf8", "#818cf8"] }, globe: { fill: "#f8fbff" }, background: "#eef5fc",
    },
  },
  {
    name: "Ink",
    swatch: ["#f6f3ec", "#b8b4ae", "#8a8a8a"],
    page: "dark",
    options: {
      colors: ["#f6f3ec", "#b8b4ae", "#8a8a8a"], gradientAngle: 300,
      dots: { intensity: 1.1, density: 0.6, highlight: 0.6, twinkle: 0.25 },
      particles: { amount: 0.35, opacity: 0.5 }, rim: { color: "#3a3a3a", strength: 0.6 },
      globe: { fill: "#121212", fillOpacity: 1 }, arcs: { colors: ["#8a8a8a", "#f6f3ec"], opacity: 0.9 },
      background: "#0a0a0b",
    },
  },
]
const ATMO_COLOUR: Record<string, string> = {
  Stripe: "#9e94ff", Midnight: "#3b82f6", Emerald: "#4cc283", Mono: "#9ca3af", Sunset: "#f97316", Ice: "#93c5fd", Ink: "#b8b4ae",
}

// ---------- controls ----------
type Row =
  | { path: string; type: "range"; label: string; min: number; max: number; step: number; unit?: string; pct?: boolean }
  | { path: string; type: "color"; label: string }
  | { path: string; type: "toggle"; label: string }
  | { path: string; type: "seg"; label: string; options: Array<[number, string]> }
type Section = { title: string; group?: "particles" | "atmosphere" | "arcs"; open?: boolean; rows: Row[] }

const SECTIONS: Section[] = [
  { title: "View", open: true, rows: [
    { path: "flat", type: "seg", label: "Projection", options: [[0, "Globe"], [1, "Flat map"]] },
    { path: "background", type: "color", label: "Background" },
  ] },
  { title: "Colours", open: true, rows: [
    { path: "colors.0", type: "color", label: "Start" },
    { path: "colors.1", type: "color", label: "Middle" },
    { path: "colors.2", type: "color", label: "End" },
    { path: "gradientAngle", type: "range", label: "Direction", min: 0, max: 360, step: 1, unit: "°" },
    { path: "gradientMid", type: "range", label: "Middle position", min: 0.1, max: 0.9, step: 0.01 },
  ] },
  { title: "Dots", open: true, rows: [
    { path: "dots.density", type: "range", label: "Density", min: 0.05, max: 1, step: 0.01, pct: true },
    { path: "dots.size", type: "range", label: "Size", min: 0.2, max: 4, step: 0.05 },
    { path: "dots.sizeVariation", type: "range", label: "Size variation", min: 0, max: 2.5, step: 0.05 },
    { path: "dots.intensity", type: "range", label: "Brightness", min: 0, max: 2, step: 0.01 },
    { path: "dots.twinkle", type: "range", label: "Twinkle", min: 0, max: 1, step: 0.01, pct: true },
    { path: "dots.highlight", type: "range", label: "Highlight fade", min: 0, max: 1, step: 0.01, pct: true },
    { path: "dots.farSide", type: "range", label: "Far side", min: 0, max: 1, step: 0.01, pct: true },
  ] },
  { title: "Particles", group: "particles", rows: [
    { path: "particles.amount", type: "range", label: "Amount", min: 0.02, max: 1, step: 0.01, pct: true },
    { path: "particles.size", type: "range", label: "Size", min: 0.2, max: 4, step: 0.05 },
    { path: "particles.rise", type: "range", label: "Rise height", min: 0.02, max: 0.5, step: 0.01 },
    { path: "particles.drift", type: "range", label: "Upward drift", min: 0, max: 0.4, step: 0.01 },
    { path: "particles.speed", type: "range", label: "Speed", min: 0.03, max: 1, step: 0.01 },
    { path: "particles.opacity", type: "range", label: "Opacity", min: 0, max: 1, step: 0.01, pct: true },
  ] },
  { title: "Atmosphere", group: "atmosphere", rows: [
    { path: "atmosphere.color", type: "color", label: "Glow colour" },
    { path: "atmosphere.strength", type: "range", label: "Strength", min: 0, max: 1, step: 0.01, pct: true },
    { path: "atmosphere.size", type: "range", label: "Size", min: 1.02, max: 1.5, step: 0.01 },
  ] },
  { title: "Arcs", group: "arcs", rows: [
    { path: "arcs.colors.0", type: "color", label: "Start colour" },
    { path: "arcs.colors.1", type: "color", label: "End colour" },
    { path: "arcs.opacity", type: "range", label: "Opacity", min: 0.1, max: 1, step: 0.01, pct: true },
    { path: "arcs.thickness", type: "range", label: "Thickness", min: 0.001, max: 0.012, step: 0.0002 },
    { path: "arcs.height", type: "range", label: "Height", min: 0.1, max: 1, step: 0.01 },
    { path: "arcs.speed", type: "range", label: "Speed", min: 0.2, max: 3, step: 0.05, unit: "×" },
    { path: "arcs.rings", type: "toggle", label: "Endpoint rings" },
  ] },
  { title: "Globe body", rows: [
    { path: "globe.fill", type: "color", label: "Fill" },
    { path: "globe.fillOpacity", type: "range", label: "Fill opacity", min: 0, max: 1, step: 0.01, pct: true },
    { path: "rim.color", type: "color", label: "Rim colour" },
    { path: "rim.strength", type: "range", label: "Rim strength", min: 0, max: 1, step: 0.01, pct: true },
  ] },
  { title: "Motion", rows: [
    { path: "rotation.auto", type: "toggle", label: "Auto-rotate" },
    { path: "rotation.direction", type: "seg", label: "Direction", options: [[1, "Left to right"], [-1, "Right to left"]] },
    { path: "rotation.speed", type: "range", label: "Speed", min: 0, max: 0.3, step: 0.005 },
    { path: "rotation.startLongitude", type: "seg", label: "Start over", options: [[-55, "Americas"], [15, "Europe & Africa"], [80, "Asia"], [140, "Oceania"]] },
    { path: "rotation.startLongitude", type: "range", label: "Start longitude", min: -180, max: 180, step: 1, unit: "°" },
    { path: "rotation.tilt", type: "range", label: "Tilt", min: -1, max: 1, step: 0.01 },
  ] },
]

// ---------- option helpers ----------
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const get = (obj: any, path: string) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj)
function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split(".")
  let o = obj
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]]
  o[keys[keys.length - 1]] = value
}
function resolve(preset: Preset): GlobeOptions {
  const base = clone(DEFAULT_OPTIONS) as any
  const p = preset.options as any
  for (const k in p) {
    if (p[k] && typeof p[k] === "object" && !Array.isArray(p[k]) && base[k]) base[k] = { ...base[k], ...p[k] }
    else base[k] = p[k]
  }
  return base
}
/** Only what differs from the library defaults, for the copied snippet. */
function diff(cur: any, def: any): any {
  if (Array.isArray(cur) || typeof cur !== "object" || cur === null || typeof def !== "object" || def === null)
    return JSON.stringify(cur) === JSON.stringify(def) ? undefined : cur
  const out: any = {}
  for (const k in cur) {
    if (k === "routes" || k === "onReady") continue
    const d = diff(cur[k], def?.[k])
    if (d !== undefined) out[k] = d
  }
  return Object.keys(out).length ? out : undefined
}

// ---------- state ----------
let presetName = "Stripe"
let state: GlobeOptions = resolve(PRESETS[0])
const groupMemory: Record<string, any> = {}

const fromHash = () => {
  try {
    const h = decodeURIComponent(location.hash.slice(1))
    if (!h) return
    const saved = JSON.parse(atob(h))
    presetName = saved.preset ?? presetName
    state = { ...resolve(PRESETS.find((p) => p.name === presetName) ?? PRESETS[0]), ...saved.options }
  } catch {
    /* ignore a bad link */
  }
}
fromHash()

const stage = document.getElementById("stage")!
const globe = createParticleGlobe(stage, { ...state, flatTransition: 1200 })
if (!globe) stage.insertAdjacentHTML("beforeend", '<p class="err">This browser has no WebGL, so the globe can\'t draw here.</p>')

function push(input: GlobeInput) {
  globe?.update(input)
}
function setPage() {
  const preset = PRESETS.find((p) => p.name === presetName)
  document.documentElement.dataset.stage = preset?.page ?? "light"
}

// ---------- build the panel ----------
const presetsEl = document.getElementById("presets")!
for (const p of PRESETS) {
  const b = document.createElement("button")
  b.type = "button"
  b.className = "preset"
  b.dataset.name = p.name
  b.innerHTML = `<span class="chip" style="background:linear-gradient(135deg,${p.swatch.join(",")})"></span><span>${p.name}</span>`
  b.addEventListener("click", () => loadPreset(p.name))
  presetsEl.appendChild(b)
}

const sync: Array<() => void> = []
const fmt = (r: Extract<Row, { type: "range" }>, v: number) =>
  r.pct ? `${Math.round(v * 100)}%` : r.unit === "°" ? `${Math.round(v)}°` : r.path === "arcs.thickness" ? (v * 1000).toFixed(1) : `${(+v).toFixed(2)}${r.unit ?? ""}`

const sectionsEl = document.getElementById("sections")!
for (const sec of SECTIONS) {
  const d = document.createElement("details")
  d.className = "section"
  if (sec.open) d.open = true
  const sum = document.createElement("summary")
  sum.innerHTML = `<span class="title">${sec.title}</span>`
  d.appendChild(sum)
  if (sec.group) {
    const g = sec.group
    const sw = document.createElement("label")
    sw.className = "switch"
    sw.title = `Turn ${sec.title.toLowerCase()} on or off`
    sw.innerHTML = `<input type="checkbox" role="switch" aria-label="${sec.title}"><span></span>`
    const box = sw.querySelector("input")!
    sw.addEventListener("click", (e) => e.stopPropagation())
    box.addEventListener("change", () => {
      const cur = state[g]
      if (box.checked && !cur) {
        const fallback = g === "atmosphere" ? { color: ATMO_COLOUR[presetName] ?? "#9e94ff", strength: 0.2, size: 1.12 } : DEFAULT_OPTIONS[g]
        ;(state as any)[g] = clone(groupMemory[g] ?? fallback)
      } else if (!box.checked && cur) {
        groupMemory[g] = clone(cur)
        ;(state as any)[g] = false
      }
      push({ [g]: state[g] } as GlobeInput)
      refresh()
    })
    sync.push(() => {
      box.checked = !!state[g]
      d.classList.toggle("off", !state[g])
    })
    sum.appendChild(sw)
  }
  const rows = document.createElement("div")
  rows.className = "rows"
  for (const r of sec.rows) rows.appendChild(row(r, sec.group))
  d.appendChild(rows)
  sectionsEl.appendChild(d)
}

function commit(r: Row, value: unknown, group?: Section["group"]) {
  if (group && !state[group]) return
  setPath(state, r.path, value)
  const top = r.path.split(".")[0] as keyof GlobeOptions
  push({ [top]: clone((state as any)[top]) } as GlobeInput)
  refresh()
}

function row(r: Row, group?: Section["group"]) {
  const el = document.createElement("div")
  el.className = `row row-${r.type}`
  const id = `c-${r.path.replace(/\./g, "-")}-${r.type}`
  if (r.type === "seg") {
    el.innerHTML = `<span class="label" id="${id}">${r.label}</span><div class="seg" role="group" aria-labelledby="${id}"></div>`
    const seg = el.querySelector(".seg")!
    const btns = r.options.map(([v, l]) => {
      const b = document.createElement("button")
      b.type = "button"
      b.textContent = l
      b.addEventListener("click", () => commit(r, v, group))
      seg.appendChild(b)
      return [b, v] as const
    })
    sync.push(() => btns.forEach(([b, v]) => b.setAttribute("aria-pressed", String(get(state, r.path) === v))))
    return el
  }
  if (r.type === "range") {
    el.innerHTML = `<label for="${id}">${r.label}</label><output for="${id}"></output><input id="${id}" type="range" min="${r.min}" max="${r.max}" step="${r.step}">`
    const inp = el.querySelector("input")!
    const out = el.querySelector("output")!
    inp.addEventListener("input", () => commit(r, parseFloat(inp.value), group))
    sync.push(() => {
      const v = get(state, r.path)
      if (v === undefined) return
      inp.value = String(v)
      out.textContent = fmt(r, v)
      inp.style.setProperty("--fill", `${((v - r.min) / (r.max - r.min)) * 100}%`)
    })
    return el
  }
  if (r.type === "color") {
    el.innerHTML = `<label for="${id}">${r.label}</label><span class="colour"><input id="${id}" type="color"><code></code></span>`
    const inp = el.querySelector("input")!
    const code = el.querySelector("code")!
    inp.addEventListener("input", () => commit(r, inp.value, group))
    sync.push(() => {
      const v = get(state, r.path)
      if (v === undefined) return
      const hex = v === "transparent" ? "#ffffff" : v
      inp.value = hex
      code.textContent = v
    })
    return el
  }
  el.innerHTML = `<label for="${id}">${r.label}</label><span class="switch"><input id="${id}" type="checkbox" role="switch"><span></span></span>`
  const inp = el.querySelector("input")!
  inp.addEventListener("change", () => commit(r, inp.checked, group))
  sync.push(() => {
    inp.checked = !!get(state, r.path)
  })
  return el
}

function refresh() {
  sync.forEach((f) => f())
  document.querySelectorAll<HTMLButtonElement>(".preset").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.name === presetName)))
  setPage()
  history.replaceState(null, "", `#${encodeURIComponent(btoa(JSON.stringify({ preset: presetName, options: diff(state, resolve(PRESETS.find((p) => p.name === presetName)!)) ?? {} })))}`)
}

function loadPreset(name: string) {
  presetName = name
  const flat = state.flat
  state = { ...resolve(PRESETS.find((p) => p.name === name)!), flat }
  push(state)
  refresh()
}

// ---------- actions ----------
const toast = document.getElementById("toast")!
let toastTimer = 0
const flash = (m: string) => {
  toast.textContent = m
  toast.classList.add("on")
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove("on"), 2200)
}
const copy = (text: string, done: string) =>
  navigator.clipboard.writeText(text).then(
    () => flash(done),
    () => flash("Couldn't reach the clipboard. Select the text instead."),
  )

document.getElementById("copy-code")!.addEventListener("click", () => {
  const opts = diff(state, DEFAULT_OPTIONS) ?? {}
  const body = JSON.stringify(opts, null, 2).replace(/"([a-zA-Z]+)":/g, "$1:")
  copy(
    `import { createParticleGlobe } from "particle-globe"\n\ncreateParticleGlobe(document.getElementById("globe"), ${body})\n`,
    "Code copied",
  )
})
document.getElementById("copy-link")!.addEventListener("click", () => copy(location.href, "Link copied"))
document.getElementById("reset")!.addEventListener("click", () => loadPreset(presetName))

refresh()
