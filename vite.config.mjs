import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createApiHandler } from './server/api.mjs'

/**
 * Dev-only: mount the local document API on the Vite server so `npm run dev`
 * gives you persistence + publishing without a second process.
 */
function resumeApi() {
  return {
    name: 'resume-api',
    configureServer(server) {
      const handler = createApiHandler()
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api') && !req.url?.startsWith('/p/')) return next()
        handler(req, res, next)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), resumeApi()],
  server: {
    port: 5178,
    strictPort: false,
  },
})
