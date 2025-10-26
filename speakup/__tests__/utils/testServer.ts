import http from 'node:http'
import { URL } from 'node:url'

//import route handlers from Next.js app router
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'

type Handler = (req: Request) => Promise<Response>

function toWebRequest(req: http.IncomingMessage, body: Buffer): Request {
  const origin = 'http://localhost'
  const url = new URL(req.url || '/', origin)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v)
    } else if (typeof value === 'string') {
      headers.set(key, value)
    }
  }
  return new Request(url.toString(), {
    method: req.method,
    headers,
    body: body.length ? new Uint8Array(body) : undefined,
  })
}

function writeWebResponse(res: http.ServerResponse, response: Response) {
  res.statusCode = response.status
  for (const [key, value] of response.headers) {
    //set-cookie may appear multiple times
    if (key.toLowerCase() === 'set-cookie') {
      const cookies = response.headers.getSetCookie()
      if (cookies.length) res.setHeader('set-cookie', cookies)
    } else {
      res.setHeader(key, value)
    }
  }
  response.arrayBuffer().then((buf) => {
    res.end(Buffer.from(buf))
  })
}

const routes: Record<string, Record<string, Handler>> = {
  '/api/auth/login': { POST: loginHandler },
  '/api/auth/signup': { POST: signupHandler },
  '/api/auth/logout': { POST: logoutHandler },
}

export function createTestServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = []
      req.on('data', (c) => chunks.push(Buffer.from(c)))
      req.on('end', async () => {
        const body = Buffer.concat(chunks)
        const url = (req.url || '').split('?')[0]
        const method = (req.method || 'GET').toUpperCase()
        const handler = routes[url]?.[method]
        if (!handler) {
          res.statusCode = 404
          res.end('Not Found')
          return
        }
        const webReq = toWebRequest(req, body)
        const webRes = await handler(webReq)
        writeWebResponse(res, webRes)
      })
    } catch (err) {
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
  return server
}
