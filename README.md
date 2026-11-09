# particle-globe

A tiny particle globe for the web: land as glowing dots, particles, arcs between places, and a morph to a flat Mercator map. Plain WebGL, no dependencies.

Demo and customiser: https://dollimore.github.io/particle-globe/

<!-- TODO for Micky: add a screenshot or GIF of the globe here -->

## Install

```sh
npm install particle-globe
pnpm add particle-globe
yarn add particle-globe
bun add particle-globe
```

## Quick start

```ts
import { createParticleGlobe } from "particle-globe"

const stage = document.querySelector<HTMLElement>("#stage")! // give it a size, a square works best
const globe = createParticleGlobe(stage, {
  colors: ["#6b54f5", "#db61db", "#eb4d54"],
  rotation: { speed: 0.05 },
})

globe?.update({ flat: 1 }) // animate to the flat map
globe?.destroy()           // when you are done
```

`createParticleGlobe` returns `null` if the browser has no WebGL.

## Options

Pass any subset. Groups (`dots`, `rotation`, `rim`, `globe`, `particles`, `atmosphere`, `arcs`) take partial objects and are merged over the defaults. Ranges are the intended range, not enforced clamps.

| Option | Type | Default | Range / notes |
|---|---|---|---|
| `colors` | `[string, string, string]` | `["#6b54f5", "#db61db", "#eb4d54"]` | Dot gradient: start, middle, end. Any CSS colour |
| `gradientAngle` | `number` | `57` | Degrees across the screen |
| `gradientMid` | `number` | `0.55` | 0.1 to 0.9 |
| `dots.intensity` | `number` | `1` | 0 to 2 |
| `dots.size` | `number` | `1` | 0.2 to 4 |
| `dots.sizeVariation` | `number` | `1` | 0 to 2.5 |
| `dots.density` | `number` | `0.55` | 0.05 to 1, share of land dots drawn |
| `dots.twinkle` | `number` | `0.28` | 0 (off) to 1 |
| `dots.highlight` | `number` | `0.78` | 0 (off) to 1 |
| `dots.farSide` | `number` | `0` | 0 (hidden) to 1 |
| `particles` | `false` or object | object below | `false` turns particles off |
| `particles.amount` | `number` | `0.4` | 0.02 to 1 |
| `particles.size` | `number` | `0.9` | |
| `particles.rise` | `number` | `0.14` | 0.02 to 0.5 |
| `particles.drift` | `number` | `0.06` | 0 to 0.4 |
| `particles.speed` | `number` | `0.22` | 0.03 to 1 |
| `particles.opacity` | `number` | `0.6` | |
| `atmosphere` | `false` or object | `false` | Off by default. Passing an object turns it on |
| `atmosphere.color` | `string` | `"#9e94ff"` | Used when switched on |
| `atmosphere.strength` | `number` | `0.16` | 0 to 1 |
| `atmosphere.size` | `number` | `1.12` | 1.02 to 1.5, relative to the globe |
| `rim.color` | `string` | `"#edebff"` | Edge highlight |
| `rim.strength` | `number` | `1` | |
| `globe.fill` | `string` | `"#ffffff"` | The sphere under the dots |
| `globe.fillOpacity` | `number` | `0.96` | |
| `background` | `string` | `"transparent"` | Stage background colour |
| `arcs` | `false` or object | object below | `false` turns arcs off |
| `arcs.routes` | `ArcRoute[]` | 20 sample routes | See route format below |
| `arcs.colors` | `[string, string]` | `["#f25c85", "#fa8c5c"]` | Start and end colour of each arc |
| `arcs.opacity` | `number` | `0.95` | |
| `arcs.thickness` | `number` | `0.0042` | 0.001 to 0.012 |
| `arcs.height` | `number` | `0.42` | 0.1 to 1, relative to distance |
| `arcs.speed` | `number` | `1` | Speed multiplier |
| `arcs.rings` | `boolean` | `true` | Rings at each end |
| `arcs.ringSize` | `number` | `1` | Size multiplier for the endpoint rings |
| `arcs.labels` | `boolean` | `false` | Show route labels at the destination |
| `rotation.auto` | `boolean` | `true` | |
| `rotation.speed` | `number` | `0.035` | Radians per second |
| `rotation.direction` | `1 or -1` | `1` | 1 spins left to right |
| `rotation.startLongitude` | `number` | `-55` | -180 to 180. Longitude facing the viewer on the globe |
| `rotation.tilt` | `number` | `0.32` | -1 to 1 |
| `flat` | `number` | `0` | 0 is the globe, 1 is a flat Mercator map, between morphs |
| `flatCentre` | `number` | `10` | -180 to 180. Longitude at the centre of the flat map; the map wraps at the opposite side |
| `flatTransition` | `number` | `1200` | Milliseconds a change to `flat` animates. 0 jumps |
| `draggable` | `boolean` | `true` | Drag to spin |
| `pauseOffscreen` | `boolean` | `true` | Pause rendering while off screen |
| `respectReducedMotion` | `boolean` | `true` | Hold still for reduced motion |
| `maxPixelRatio` | `number` | `2` | Upper bound for canvas pixel ratio |
| `onReady` | `() => void` | none | Called once the first frame is on screen |

Turn a group off with `false`, back on by passing an object:

```ts
globe.update({ particles: false, arcs: false })
globe.update({ atmosphere: { color: "#9e94ff" } })
```

### Arc routes

Each route is `{ from: [lat, lon], to: [lat, lon], label?: string }`. Latitude and longitude are in degrees. `label` shows at the destination when `arcs.labels` is on.

```ts
createParticleGlobe(stage, {
  arcs: {
    labels: true,
    routes: [
      { from: [51.5, -0.12], to: [40.71, -74.0], label: "New York" },
      { from: [35.68, 139.69], to: [1.35, 103.82], label: "Singapore" },
    ],
  },
})
```

The defaults are exported as `DEFAULT_OPTIONS` and `DEFAULT_ROUTES`. Types: `GlobeOptions`, `GlobeInput`, `ParticleGlobe`, `ArcRoute`, `LatLon`.

## Handle

`createParticleGlobe(stage, options?)` returns:

- `update(input)` changes any options. Only what you pass changes.
- `resize()` re-measures the stage. It also happens on its own when the stage resizes.
- `destroy()` stops rendering, frees GPU resources and removes the canvas.
- `options` is the read-only set of options in effect now.

## Performance

- The library is about 11.1 KB gzipped (23.3 KB raw, 9.9 KB brotli), including the land data. Run `npm run size` to measure it.
- Land is a 5 KB run-length grid, not a mesh or a texture download.
- Rendering pauses while the stage is off screen (`pauseOffscreen`) and holds still for reduced motion (`respectReducedMotion`).
- The canvas pixel ratio is capped at `maxPixelRatio` (2). Lower it, or lower `dots.density` and `particles.amount`, on slow devices.

## Browser support

Uses WebGL2 and falls back to WebGL1. If neither exists, `createParticleGlobe` returns `null`, so you can show a fallback.

## Accessibility

The globe is decorative. Mark the stage `aria-hidden="true"` and put any meaningful content in real text next to it.

```html
<div id="stage" aria-hidden="true" style="width: 480px; height: 480px"></div>
```

## Rebuilding the land mask

`src/land-mask.ts` is generated from Natural Earth. To rebuild it, download `ne_50m_land.geojson` from [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) (`geojson/`), then:

```sh
npm run land -- path/to/ne_50m_land.geojson [cellsPerDegree]
```

The default is 2 cells per degree.

## Development

```sh
npm install
npm run dev          # customiser demo
npm run build        # dist/particle-globe.js and type declarations
npm run build:demo   # demo-dist, for GitHub Pages
npm run size
```

## Credits

Land outlines from Natural Earth (public domain), https://www.naturalearthdata.com

## Licence

MIT. Copyright (c) 2026 Micky Dollimore.
