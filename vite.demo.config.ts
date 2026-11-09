import { defineConfig } from "vite"

export default defineConfig({
  root: "demo",
  base: "/particle-globe/",
  build: { outDir: "../demo-dist", emptyOutDir: true, target: "es2019" },
})
