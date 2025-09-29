import { defineConfig } from 'tsup'

export default defineConfig(options => ({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: options.minify ?? false,
  target: 'es2020',
  outDir: 'dist',
  shims: true,
  treeshake: true,
  external: [],
  noExternal: [],
  banner: {
    js: '/* Forge DDD Framework - MIT License */'
  }
}))
