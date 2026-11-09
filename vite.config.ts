import { defineConfig, type Plugin } from "vite"
import { minify } from "terser"

const GLSL_WORDS = new Set(
  `attribute uniform varying const void float int bool vec2 vec3 vec4 mat2 mat3 mat4 precision highp mediump lowp
  if else for while do return discard break continue true false main in out inout
  gl_Position gl_PointSize gl_PointCoord gl_FragColor gl_FragCoord
  mix clamp smoothstep normalize length dot cross sin cos tan asin acos atan log exp pow sqrt abs sign floor ceil fract mod min max step`.split(/\s+/),
)
const SHORT_NAMES = (() => {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const all = [...letters]
  for (const x of letters) for (const y of letters + "0123456789") all.push(x + y)
  return all.filter((n) => !GLSL_WORDS.has(n))
})()

/** Smallest legal spelling of a GLSL float literal: 0.50 -> .5, 3.0 -> 3. */
function shortNumber(t: string) {
  if (!/^\d*\.\d*$/.test(t)) return t
  const [i, f] = t.split(".")
  const frac = f.replace(/0+$/, "")
  return (frac && /^0*$/.test(i) ? "" : i) + "." + frac
}

/**
 * Build-time GLSL minifier for src/index.ts. The source keeps readable shaders;
 * the build strips whitespace, shortens numbers and renames every shader
 * identifier (uniforms, varyings, attributes, locals) to a short one. The JS
 * side refers to uniforms by string and to attributes by object key, so those
 * are renamed to match.
 */
function shaderMinify(): Plugin {
  return {
    name: "shader-minify",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/index\.ts$/.test(id)) return null
      const start = code.indexOf("// ---------- shaders ----------")
      const end = code.indexOf("const LABEL_CSS")
      if (start < 0 || end < 0) throw new Error("shader block markers not found")
      const strings = /`[^`]*`/g
      const tokenRe = /[A-Za-z_]\w*|\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+|[^\s]/g
      const tokenise = (s: string) => s.slice(1, -1).replace(/\/\/.*|\/\*[\s\S]*?\*\//g, " ").match(tokenRe) || []
      const block = code.slice(start, end)

      // Which identifiers are renamed: everything that is not GLSL itself or a swizzle.
      const count = new Map<string, number>()
      const isRenamed = (tok: string, prev: string | undefined) => /^[A-Za-z_]/.test(tok) && prev !== "." && !GLSL_WORDS.has(tok)
      const declared = { uniform: new Set<string>(), attribute: new Set<string>() }
      for (const lit of block.match(strings) || []) {
        const toks = tokenise(lit)
        toks.forEach((t, i) => {
          if (isRenamed(t, toks[i - 1])) count.set(t, (count.get(t) || 0) + 1)
        })
        for (const m of lit.matchAll(/\b(uniform|attribute)\s+(?:highp\s+)?\w+\s+([^;]+);/g))
          for (const nm of m[2].split(",")) declared[m[1] as "uniform" | "attribute"].add(nm.trim())
      }
      const names = new Map([...count].sort((a, b) => b[1] - a[1]).map(([n], i) => [n, SHORT_NAMES[i]]))

      const minified = block.replace(strings, (lit) => {
        const toks = tokenise(lit)
        let out = ""
        let prev = ""
        toks.forEach((t, i) => {
          const tok = isRenamed(t, toks[i - 1]) ? names.get(t)! : shortNumber(t)
          const last = prev.slice(-1)
          const joins = prev !== "." && tok !== "." && /[\w.]/.test(last) && (/\w/.test(tok[0]) || (tok[0] === "." && tok.length > 1))
          if (out && (joins || ((last === "+" || last === "-") && tok[0] === last))) out += " "
          out += tok
          prev = tok
        })
        return "`" + out + "`"
      })

      // JS side: uniform names in string literals, attribute names as keys of the attribute maps.
      let rest = code.slice(0, start) + "\u0000" + code.slice(end)
      rest = rest.replace(/"([A-Za-z_]\w*)"/g, (m, n) => (declared.uniform.has(n) ? `"${names.get(n)}"` : m))
      rest = rest.replace(/\b([A-Za-z_]\w*)(\??:\s*\[)/g, (m, n, tail) => (declared.attribute.has(n) ? names.get(n) + tail : m))
      return { code: rest.replace("\u0000", minified), map: null }
    },
  }
}

/** Vite keeps whitespace in ES library output; terser minifies the final chunk fully (no unsafe options, so float maths is untouched). */
function minifyChunk(): Plugin {
  return {
    name: "minify-chunk",
    enforce: "post",
    apply: "build",
    async generateBundle(_, bundle) {
      for (const f of Object.values(bundle)) {
        if (f.type !== "chunk") continue
        const r = await minify(f.code, {
          module: true,
          ecma: 2019,
          compress: { passes: 3, pure_getters: true },
          mangle: { toplevel: true },
          format: { comments: false },
        })
        f.code = r.code!
      }
    },
  }
}

export default defineConfig({
  plugins: [shaderMinify(), minifyChunk()],
  build: {
    target: "es2019",
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "particle-globe.js" },
  },
})
