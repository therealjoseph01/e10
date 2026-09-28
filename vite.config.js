import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`        → production build in /dist (the official assets ship in /dist/e1o)
// `npm run build:single` → one self-contained HTML file in /preview. Double-click it: opened from disk it loads
//                          the official assets from e1o.com, so it needs a connection but no server.
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    base: single ? './' : '/',
    build: single
      ? { outDir: 'preview', emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000, copyPublicDir: false }
      : {
          chunkSizeWarningLimit: 1500,
          rollupOptions: {
            output: {
              manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : id.includes('node_modules') ? 'vendor' : undefined),
            },
          },
        },
  }
})
