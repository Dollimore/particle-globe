import { readFileSync } from "node:fs"
import { gzipSync, brotliCompressSync } from "node:zlib"

// Every built entry. The core is "particle-globe.js"; the wrappers import it and add only their own code.
for (const name of ["particle-globe.js", "element.js", "react.js"]) {
  const buf = readFileSync(new URL(`../dist/${name}`, import.meta.url))
  const gz = gzipSync(buf, { level: 9 }).length
  console.log(`${name.padEnd(18)} raw ${String(buf.length).padStart(6)}  gzip ${String(gz).padStart(6)}  brotli ${String(brotliCompressSync(buf).length).padStart(6)}`)
}
