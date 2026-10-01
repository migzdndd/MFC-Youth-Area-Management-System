import http from 'http';
import { parse as parseUrl } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routerHandler from './api/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if present, else root .env.local or .env
const envPaths = [
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env')
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf-8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val.trim();
      }
    }
    console.log(`[Backend Dev Server] Loaded environment from ${p}`);
    break;
  }
}

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS configuration for local development and native apps
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MFC-Area-ID, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsed = parseUrl(req.url, true);
  let pathname = parsed.pathname;

  // Support /api/xyz or /xyz
  let route = pathname.replace(/^\/api\//, '').replace(/^\//, '');

  const query = { ...parsed.query, route };

  // Read request body
  let body = null;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString('utf-8');

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  // Build Express/Vercel-like req and res wrappers
  const wrappedReq = {
    ...req,
    query,
    body,
    headers: req.headers,
    method: req.method,
    url: req.url
  };

  const wrappedRes = {
    ...res,
    headersSent: false,
    status(code) {
      res.statusCode = code;
      return this;
    },
    setHeader(key, val) {
      res.setHeader(key, val);
      return this;
    },
    hasHeader(key) {
      return res.hasHeader(key);
    },
    getHeader(key) {
      return res.getHeader(key);
    },
    json(data) {
      if (this.headersSent) return;
      this.headersSent = true;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
    },
    send(data) {
      if (this.headersSent) return;
      this.headersSent = true;
      res.end(data);
    }
  };

  try {
    await routerHandler(wrappedReq, wrappedRes);
  } catch (err) {
    console.error('[Backend Dev Server] Error:', err);
    if (!wrappedRes.headersSent) {
      wrappedRes.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`[Backend Dev Server] Listening on http://localhost:${PORT}`);
  console.log(`[Backend Dev Server] API routes available under http://localhost:${PORT}/api/*`);
});
