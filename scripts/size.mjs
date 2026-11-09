import { readFileSync } from "node:fs"
import { gzipSync, brotliCompressSync } from "node:zlib"

const file = new URL("../dist/particle-globe.js", import.meta.url)
const buf = readFileSync(file)
const kb = (n) => (n / 1024).toFixed(2) + " KB"
console.log(`raw     ${kb(buf.length)} (${buf.length} bytes)`)
console.log(`gzip    ${kb(gzipSync(buf, { level: 9 }).length)}`)
console.log(`brotli  ${kb(brotliCompressSync(buf).length)}`)
