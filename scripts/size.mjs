import { readFileSync } from "node:fs"
import { gzipSync, brotliCompressSync } from "node:zlib"

const file = new URL("../dist/particle-globe.js", import.meta.url)
const buf = readFileSync(file)
console.log(`raw     ${buf.length} bytes`)
console.log(`gzip -9 ${gzipSync(buf, { level: 9 }).length} bytes`)
console.log(`brotli  ${brotliCompressSync(buf).length} bytes`)
