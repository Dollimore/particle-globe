// Checks that the land grid the library decodes is identical, cell for cell, to a grid file.
//
//   node scripts/verify-land.mjs reference-grid.bin
//
// reference-grid.bin is W*H bytes (0 sea, 1 land), row 0 at 90°N. It pulls the
// real decoder out of src/index.ts, so what is tested is what ships.
import { readFileSync } from "node:fs"
import { transformSync } from "esbuild"
import { LAND_DATA, LAND_H, LAND_W } from "../src/land-mask.ts"

const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8")
const block = src.slice(src.indexOf("let landGrid"), src.indexOf("const isLand"))
const js = transformSync(block, { loader: "ts" }).code
const landMask = new Function("LAND_DATA", "LAND_W", "LAND_H", `${js}\nreturn landMask()`)(LAND_DATA, LAND_W, LAND_H)
const S = LAND_W + 4
const ref = readFileSync(process.argv[2])
let diff = 0
for (let y = 0; y < LAND_H; y++) for (let x = 0; x < LAND_W; x++) if (landMask[(y + 2) * S + x + 2] !== ref[y * LAND_W + x]) diff++
console.log(diff === 0 ? `identical: ${LAND_W * LAND_H} cells` : `MISMATCH: ${diff} cells differ`)
process.exit(diff ? 1 : 0)
