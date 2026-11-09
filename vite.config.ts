import { defineConfig, transformWithEsbuild, type Plugin } from "vite"

/**
 * Shrinks the GLSL template strings in src/index.ts: collapses whitespace
 * inside the shader block only. The shaders have no preprocessor lines or
 * line comments, so joining lines is safe.
 */
function shaderWhitespace(): Plugin {
  return {
    name: "shader-whitespace",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/index\.ts$/.test(id)) return null
      const start = code.indexOf("// ---------- shaders ----------")
      const end = code.indexOf("const LABEL_CSS")
      if (start < 0 || end < 0) throw new Error("shader block markers not found")
      const block = code.slice(start, end).replace(/`[^`]*`/g, (s) =>
        s
          .replace(/\s+/g, " ")
          .replace(/ ?([{};,]) ?/g, "$1")
          .replace(/^` /, "`")
          .replace(/ `$/, "`"),
      )
      return { code: code.slice(0, start) + block + code.slice(end), map: null }
    },
  }
}

/** Vite keeps whitespace in ES library output; this minifies the final chunk fully. */
function minifyChunk(): Plugin {
  return {
    name: "minify-chunk",
    enforce: "post",
    apply: "build",
    async generateBundle(_, bundle) {
      for (const f of Object.values(bundle)) {
        if (f.type !== "chunk") continue
        const r = await transformWithEsbuild(f.code, f.fileName, { minify: true, target: "es2019", legalComments: "none" })
        f.code = r.code
      }
    },
  }
}

export default defineConfig({
  plugins: [shaderWhitespace(), minifyChunk()],
  build: {
    target: "es2019",
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "particle-globe.js" },
  },
})
