"use client"
/**
 * <ParticleGlobe /> for React 19 and the Next.js App Router.
 *
 *   import { ParticleGlobe } from "particle-globe/react"
 *   <ParticleGlobe className="globe" flat={0} colors={["#6b54f5", "#db61db", "#eb4d54"]} />
 *
 * Options are props. The globe is created on mount, `update()` runs when props change, and
 * `destroy()` runs on unmount. Pass `ref` to reach the instance.
 */
import { createElement, useEffect, useRef, type HTMLAttributes, type ReactElement, type Ref } from "react"
import { createParticleGlobe, DEFAULT_OPTIONS, type GlobeInput, type ParticleGlobe as Globe } from "./index"

export interface ParticleGlobeProps extends GlobeInput, Omit<HTMLAttributes<HTMLDivElement>, keyof GlobeInput | "ref"> {
  /** Receives the globe instance once it exists (null while unmounted, or without WebGL). */
  ref?: Ref<Globe | null>
}

const OPTION_KEYS = [...Object.keys(DEFAULT_OPTIONS), "onReady"]

function setRef(ref: Ref<Globe | null> | undefined, v: Globe | null) {
  if (typeof ref === "function") ref(v)
  else if (ref) ref.current = v
}

export function ParticleGlobe({ ref, className, style, ...props }: ParticleGlobeProps): ReactElement {
  const el = useRef<HTMLDivElement>(null)
  const globe = useRef<Globe | null>(null)
  const options: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const k in props) ((OPTION_KEYS.includes(k) ? options : rest) as any)[k] = (props as any)[k]

  // What the globe was last given, so a prop that disappears goes back to its default.
  const latest = useRef(options)
  latest.current = options
  const given = useRef<{ key: string; keys: string[] }>({ key: "", keys: [] })
  const refRef = useRef(ref)
  refRef.current = ref
  const key = JSON.stringify(options)

  useEffect(() => {
    const g = createParticleGlobe(el.current!, { ...latest.current, onReady: () => (latest.current.onReady as any)?.() })
    globe.current = g
    given.current = { key, keys: Object.keys(latest.current) }
    setRef(refRef.current, g)
    return () => {
      g?.destroy()
      globe.current = null
      setRef(refRef.current, null)
    }
  }, [])

  useEffect(() => {
    if (!globe.current || given.current.key === key) return
    const next: Record<string, unknown> = { ...options }
    for (const k of given.current.keys) if (!(k in next) && k !== "onReady") next[k] = (DEFAULT_OPTIONS as any)[k]
    given.current = { key, keys: Object.keys(options) }
    globe.current.update(next as GlobeInput)
  }, [key])

  return createElement("div", { ...rest, ref: el, className, style: { position: "relative", ...style } })
}

export type { GlobeInput, GlobeOptions, ArcRoute, MarkerPlace, IconStyle, Focus, ParticleGlobe as ParticleGlobeInstance } from "./index"
