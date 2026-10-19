import { createServer } from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const PUBLISH_DIR = path.join(__dirname, 'published')
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/
const MAX_BODY = 4 * 1024 * 1024

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(PUBLISH_DIR, { recursive: true })
}

function send(res, status, payload, headers = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': typeof payload === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function docPath(id) {
  return path.join(DATA_DIR, `${id}.json`)
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

/** Connect/Express-style handler. Mounted at /api and /p in dev, used directly in prod. */
export function createApiHandler() {
  return async function handler(req, res, next) {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)

    try {
      if (pathname === '/api/health') {
        return send(res, 200, { ok: true, service: 'resume-studio', time: new Date().toISOString() })
      }

      if (pathname === '/api/docs' && req.method === 'GET') {
        await ensureDirs()
        const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'))
        const docs = []
        for (const file of files) {
          try {
            const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'))
            docs.push({ id: raw.id, title: raw.title ?? '未命名简历', updatedAt: raw.updatedAt ?? null })
          } catch {
            /* skip broken file */
          }
        }
        docs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        return send(res, 200, { docs })
      }

      const docMatch = pathname.match(/^\/api\/docs\/([^/]+)$/)
      if (docMatch) {
        const id = docMatch[1]
        if (!ID_RE.test(id)) return send(res, 400, { error: 'invalid id' })
        await ensureDirs()

        if (req.method === 'GET') {
          try {
            const raw = await fs.readFile(docPath(id), 'utf8')
            return send(res, 200, JSON.parse(raw))
          } catch {
            return send(res, 404, { error: 'not found' })
          }
        }

        if (req.method === 'PUT') {
          const body = await readBody(req)
          if (!body || typeof body !== 'object' || !body.data) return send(res, 400, { error: 'data required' })
          const record = {
            id,
            title: String(body.title ?? '未命名简历').slice(0, 120),
            updatedAt: new Date().toISOString(),
            data: body.data,
          }
          await fs.writeFile(docPath(id), JSON.stringify(record, null, 2), 'utf8')
          return send(res, 200, { ok: true, id, updatedAt: record.updatedAt })
        }

        if (req.method === 'DELETE') {
          await fs.rm(docPath(id), { force: true })
          return send(res, 200, { ok: true })
        }
      }

      if (pathname === '/api/publish' && req.method === 'POST') {
        const body = await readBody(req)
        if (!body?.html || typeof body.html !== 'string') return send(res, 400, { error: 'html required' })
        await ensureDirs()
        const slug = ID_RE.test(String(body.id ?? '')) ? String(body.id) : `resume-${Date.now().toString(36)}`
        await fs.writeFile(path.join(PUBLISH_DIR, `${slug}.html`), body.html, 'utf8')
        return send(res, 200, { ok: true, path: `/p/${slug}.html`, title: String(body.title ?? '') })
      }

      const pubMatch = pathname.match(/^\/p\/([a-z0-9-]+)\.html$/)
      if (pubMatch && req.method === 'GET') {
        try {
          const html = await fs.readFile(path.join(PUBLISH_DIR, `${pubMatch[1]}.html`), 'utf8')
          return send(res, 200, html, { 'content-type': 'text/html; charset=utf-8' })
        } catch {
          return send(res, 404, 'not published')
        }
      }

      return send(res, 404, { error: 'unknown endpoint' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'server error'
      return send(res, 500, { error: message })
    }
  }
}

/** Production server: static dist + API + published pages. */
export function startServer(port = Number(process.env.PORT ?? 5174)) {
  const DIST = path.join(__dirname, '..', 'dist')
  const api = createApiHandler()
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.json': 'application/json; charset=utf-8',
    '.woff2': 'font/woff2',
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)
    if (pathname.startsWith('/api') || pathname.startsWith('/p/')) return api(req, res)

    const file = pathname === '/' ? path.join(DIST, 'index.html') : path.join(DIST, pathname)
    const safe = path.resolve(file)
    if (!safe.startsWith(path.resolve(DIST))) {
      res.writeHead(403)
      return res.end('forbidden')
    }
    try {
      const buf = await fs.readFile(safe)
      res.writeHead(200, { 'content-type': MIME[path.extname(safe)] ?? 'application/octet-stream' })
      res.end(buf)
    } catch {
      try {
        const html = await fs.readFile(path.join(DIST, 'index.html'))
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        return res.end(html)
      } catch {
        res.writeHead(404)
        res.end('not found — run `npm run build` first')
      }
    }
  }).listen(port, () => {
    console.log(`\n  Resume Studio  →  http://localhost:${port}\n`)
  })
}

export { escapeHtml }
