import http from "node:http";
import { URL } from "node:url";

// Bring in the route handlers from the Next.js API
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { POST as signupRoute } from "@/app/api/auth/signup/route";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";

type RouteHandler = (req: Request) => Promise<Response>;

const routeTable: Record<string, Record<string, RouteHandler>> = {
  "/api/auth/login": { POST: loginRoute },
  "/api/auth/signup": { POST: signupRoute },
  "/api/auth/logout": { POST: logoutRoute },
};

/**
 * Converts a Node.js request into a Web Fetch API Request.
 */
function toFetchRequest(nodeReq: http.IncomingMessage, buffer: Buffer): Request {
  const base = "http://localhost";
  const requestUrl = new URL(nodeReq.url || "/", base);
  const headers = new Headers();

  for (const [header, value] of Object.entries(nodeReq.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(header, v));
    } else if (typeof value === "string") {
      headers.set(header, value);
    }
  }

  return new Request(requestUrl.toString(), {
    method: nodeReq.method,
    headers,
    body: buffer.length ? new Uint8Array(buffer) : undefined,
  });
}

/**
 * Writes a Web Fetch API Response back to the Node.js HTTP response.
 */
async function sendFetchResponse(res: http.ServerResponse, response: Response) {
  res.statusCode = response.status;

  for (const [header, value] of response.headers) {
    if (header.toLowerCase() === "set-cookie") {
      const cookies = response.headers.getSetCookie?.();
      if (cookies?.length) res.setHeader("set-cookie", cookies);
    } else {
      res.setHeader(header, value);
    }
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

/**
 * Creates a simple HTTP server that can mimic the Next.js API route layer.
 */
export function createTestServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const bodyChunks: Buffer[] = [];

      req.on("data", (chunk) => bodyChunks.push(Buffer.from(chunk)));
      req.on("end", async () => {
        const body = Buffer.concat(bodyChunks);
        const path = (req.url || "").split("?")[0];
        const method = (req.method || "GET").toUpperCase();

        const handler = routeTable[path]?.[method];
        if (!handler) {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }

        const fetchRequest = toFetchRequest(req, body);
        const fetchResponse = await handler(fetchRequest);
        await sendFetchResponse(res, fetchResponse);
      });
    } catch (error) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  return server;
}
