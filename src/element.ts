/**
 * <particle-globe>: the globe as a custom element, for plain HTML, Vite, Vue, Svelte, Solid and Astro.
 *
 *   import "particle-globe/element"
 *   <particle-globe style="width: 480px; height: 480px" flat="1" focus="europe"></particle-globe>
 *
 * Simple options are attributes (attribute list in this file). Anything else goes in the `options` property or in an
 * `options` attribute holding JSON. Importing this on the server is safe; it only registers in a browser.
 */
import { createParticleGlobe, DEFAULT_MARKERS, DEFAULT_OPTIONS, REGIONS, type GlobeInput, type ParticleGlobe } from "./index"

type Kind = "num" | "str" | "bool" | "colors" | "focus" | "group"
/** attribute name -> [option path, how to read it]. */
const ATTRS: Record<string, [string, Kind]> = {
  colors: ["colors", "colors"],
  background: ["background", "str"],
  "gradient-angle": ["gradientAngle", "num"],
  "gradient-mid": ["gradientMid", "num"],
  flat: ["flat", "num"],
  "flat-centre": ["flatCentre", "num"],
  "flat-transition": ["flatTransition", "num"],
  focus: ["focus", "focus"],
  "focus-transition": ["focusTransition", "num"],
  drag: ["draggable", "bool"],
  "pause-offscreen": ["pauseOffscreen", "bool"],
  "respect-reduced-motion": ["respectReducedMotion", "bool"],
  "max-pixel-ratio": ["maxPixelRatio", "num"],
  "dots-density": ["dots.density", "num"],
  "dots-size": ["dots.size", "num"],
  "dots-intensity": ["dots.intensity", "num"],
  "dots-twinkle": ["dots.twinkle", "num"],
  "dots-highlight": ["dots.highlight", "num"],
  "dots-far-side": ["dots.farSide", "num"],
  "rotation-auto": ["rotation.auto", "bool"],
  "rotation-speed": ["rotation.speed", "num"],
  "rotation-direction": ["rotation.direction", "num"],
  "rotation-start-longitude": ["rotation.startLongitude", "num"],
  "rotation-tilt": ["rotation.tilt", "num"],
  "rim-color": ["rim.color", "str"],
  "globe-fill": ["globe.fill", "str"],
  particles: ["particles", "group"],
  atmosphere: ["atmosphere", "group"],
  arcs: ["arcs", "group"],
  "arcs-labels": ["arcs.labels", "bool"],
  "arcs-icons": ["arcs.icons.show", "bool"],
  "arcs-icon-size": ["arcs.icons.size", "num"],
  "arcs-icon-style": ["arcs.icons.style", "str"],
  markers: ["markers", "group"],
  "markers-labels": ["markers.labels", "bool"],
  "markers-style": ["markers.style", "str"],
  "markers-size": ["markers.size", "num"],
  "markers-speed": ["markers.speed", "num"],
  "markers-count": ["markers.count", "num"],
  "markers-color": ["markers.color", "str"],
}

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v)
function deepMerge(a: any, b: any): any {
  if (!isObj(a) || !isObj(b)) return b
  const out = { ...a }
  for (const k in b) out[k] = deepMerge(a[k], b[k])
  return out
}
function setIn(path: string, value: unknown): any {
  return path.split(".").reduceRight((v, k) => ({ [k]: v }), value as any)
}
const getIn = (o: any, path: string) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o)

/** The value an attribute stands for; undefined when it can't be read (the option is then left alone). */
function read(kind: Kind, raw: string): unknown {
  const v = raw.trim()
  switch (kind) {
    case "num": {
      const n = parseFloat(v)
      return isFinite(n) ? n : undefined
    }
    case "str":
      return v
    case "bool":
      return v !== "false"
    case "colors":
      return v.split(",").map((c) => c.trim())
    case "focus": {
      if (!v || v === "none") return null
      if (v in REGIONS) return v
      const [lat, lon, zoom] = v.split(/[\s,]+/).map(parseFloat)
      return isFinite(lat) && isFinite(lon) ? { lat, lon, zoom: isFinite(zoom) ? zoom : 4 } : undefined
    }
    case "group":
      return v === "false" ? false : v === "true" || v === "" ? {} : undefined
  }
}

export interface ParticleGlobeElement extends HTMLElement {
  /** Options beyond the simple attributes. Setting it updates the globe. */
  options: GlobeInput
  /** The running globe, or null before it is connected or when WebGL is missing. */
  readonly globe: ParticleGlobe | null
}

/** Register the element. Called once on import in a browser; call it yourself to use another tag name. */
export function defineParticleGlobe(tag = "particle-globe"): void {
  if (typeof customElements === "undefined" || customElements.get(tag)) return
  class El extends HTMLElement {
    static observedAttributes = ["options", ...Object.keys(ATTRS)]
    private g: ParticleGlobe | null = null
    private opts: GlobeInput = {}

    get options() {
      return this.opts
    }
    set options(v: GlobeInput) {
      this.opts = v && typeof v === "object" ? v : {}
      this.g?.update(this.input())
    }
    get globe() {
      return this.g
    }

    /** Everything the element is asked for: the JSON attribute, then the property, then the simple attributes. */
    private input(): GlobeInput {
      let out: any = {}
      try {
        const j = this.getAttribute("options")
        if (j) out = JSON.parse(j)
      } catch {}
      out = deepMerge(out, this.opts)
      for (const name in ATTRS) {
        const raw = this.getAttribute(name)
        if (raw === null) continue
        const v = read(ATTRS[name][1], raw)
        if (v !== undefined) out = deepMerge(out, setIn(ATTRS[name][0], v))
      }
      return out
    }

    connectedCallback() {
      if (this.g) return
      if (getComputedStyle(this).display === "inline") this.style.display = "block"
      if (!this.clientHeight) this.style.aspectRatio = "1"
      this.g = createParticleGlobe(this, { ...this.input(), onReady: () => this.dispatchEvent(new CustomEvent("ready")) })
    }
    disconnectedCallback() {
      this.g?.destroy()
      this.g = null
    }
    attributeChangedCallback(name: string, _old: string | null, val: string | null) {
      if (!this.g) return
      if (name === "options") return void this.g.update(this.input())
      const [path, kind] = ATTRS[name]
      // A removed attribute puts the option back to its default.
      const v = val === null ? (path.startsWith("markers.") ? getIn({ markers: DEFAULT_MARKERS }, path) : getIn(DEFAULT_OPTIONS, path)) : read(kind, val)
      if (v !== undefined) this.g.update(setIn(path, v))
    }
  }
  customElements.define(tag, El)
}

defineParticleGlobe()

declare global {
  interface HTMLElementTagNameMap {
    "particle-globe": ParticleGlobeElement
  }
}
