# Changelog

## 0.1.0 (unreleased)

First release.

### Library

- Land as glowing dots from a 5 KB range-coded Natural Earth grid, floating particles, animated arcs with endpoint rings and labels, and a morph from the globe to a flat Mercator map (`flat`, `flatCentre`).
- Region focus: `update({ focus })` flies the camera to World, Americas, Europe, Africa, Middle East or Asia Pacific, or to a custom `{ lat, lon, zoom }`, on the globe and on the flat map. `focusTransition` sets the length; reduced motion jumps. A denser layer of dots fades in when zoomed.
- Dot `size` goes down to 0.1 (small dots turn soft) and `density` goes up to 5 (five times the default set).
- Safe to import on the server: nothing touches `window` or `document` until you call `createParticleGlobe`, which returns `null` there.
- `destroy()` frees every GPU resource, listener, observer, animation frame and DOM node it added, including the injected label style once the last globe is gone. Repeated create and destroy does not grow.
- Handles a lost WebGL context and restores it, follows resizes and device pixel ratio changes, and stops drawing while off screen or hidden. Reduced motion holds still and skips redundant frames.
- Touch: with `draggable: false` the canvas leaves every gesture to the page; with it on, vertical swipes still scroll.
- Bad input (NaN, wrong types, unparseable colours, malformed or empty routes, unknown keys) is ignored and the previous value stays. `update()` after `destroy()` does nothing.
- Fixed the console warning "drawElements: no buffer is bound to enabled attribute" that appeared after arcs were rebuilt.
- Fragment shaders fall back to medium precision where high precision is missing.

- Arc icons are one group: `arcs.icons` is `{ show, size, style }`, where `style` is `"ring"` (a stroked ring with a bright core, the default) or `"solid"` (one filled dot in the arc's end colour). It replaces `arcs.rings` and `arcs.ringSize`; the defaults render the same pixels as before.
- Markers: `markers` shows places (`{ lat, lon, label }`) one at a time or a few staggered, each with a pulse and a label that fades in beside it, holds, then fades out. Works on the globe and the flat map, alone or with arcs. Far-side markers are skipped and fade out, labels stay inside the stage and avoid each other, and reduced motion holds a few still. Off by default. It reuses the arc icon shader and label layer. Exports `DEFAULT_MARKERS` and `DEFAULT_PLACES`.
- Element attributes `arcs-icons`, `arcs-icon-size`, `arcs-icon-style` (replacing `arcs-rings`), and `markers`, `markers-*`.

### Entries

- `particle-globe/element`: a `<particle-globe>` custom element. Attributes for simple options, an `options` property or JSON attribute for the rest.
- `particle-globe/react`: a React 19 `<ParticleGlobe />` with `"use client"` for the Next.js App Router. React is an optional peer dependency.
- `particle-globe/astro`: an Astro component that wraps the element.

### Customiser

- Region control with a custom latitude, longitude and zoom popover; wider Size and Density ranges.
- On the flat map the controls that do nothing there (Motion, Far side, Route labels) are hidden. Their values stay.
- Arcs has an Arc icons group (on or off, Ring or Solid, size) and there is a Markers section with a places list, colour, style, size, timing, how many at once and labels. A Cities preset starts with arcs off and markers on. Share links that used `rings` and `ringSize` still load.
- Page title, description, social preview image and favicon.
