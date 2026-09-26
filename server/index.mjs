// Exnovo Agentic OS web server: serves the built UI (dist/) and a read-only quest API.
// Config (env): HOST, PORT, DIST, POLL_MS, and the standard PG* variables for Postgres.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { toQuest, summarize, fingerprint, ROSTER, asUtc, CAUSES } from './quests.mjs';

// timestamp without time zone (OID 1114) holds UTC in Agentic OS: parse it as UTC, not server-local time.
pg.types.setTypeParser(1114, (v) => new Date(asUtc(v)));

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? 5180);
const POLL_MS = Number(process.env.POLL_MS ?? 3000);
const DIST = resolve(process.env.DIST ?? join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist'));

const FIXTURE = process.env.FIXTURE; // path to a JSON array of task rows: dev and screenshots without a database
const pool = new pg.Pool({ max: 3, idleTimeoutMillis: 30_000, statement_timeout: 5_000 });
pool.on('error', (e) => console.error('[pg]', e.message));

// ---- shared state, refreshed by one poller for all clients ----
let quests = [];
let lastPrint = '';
let dbOk = false;
let dbError = null;
let lastPollAt = null;
const clients = new Set();

async function poll() {
  try {
    const rows = FIXTURE
      ? JSON.parse(await readFile(FIXTURE, 'utf8'))
      : (await pool.query('SELECT id, spec, status, iteration_count, created_at, right(error_trace, 2000) AS error_trace, left(error_trace, 40) AS trace_head, length(test_output) AS test_len FROM tasks ORDER BY created_at DESC LIMIT 500')).rows;
    const now = Date.now();
    quests = rows.map((r) => toQuest(r, now));
    dbOk = true;
    dbError = null;
  } catch (e) {
    dbOk = false;
    dbError = e.message;
  }
  lastPollAt = new Date().toISOString();
  const print = `${dbOk}|${fingerprint(quests)}`;
  if (print !== lastPrint) {
    lastPrint = print;
    broadcast('snapshot', snapshot());
  }
}

const health = () => ({ db: dbOk ? 'up' : 'down', error: dbOk ? null : dbError, lastPollAt, clients: clients.size });
const snapshot = () => ({ quests, summary: summarize(quests), roster: ROSTER, causes: CAUSES, health: health() });

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

// ---- HTTP ----
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function serveStatic(req, res, pathname) {
  let rel;
  try { rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, ''); } catch { rel = '/'; }
  let file = join(DIST, rel);
  if (!file.startsWith(DIST)) return json(res, 400, { error: 'bad path' });
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(DIST, 'index.html'); // SPA fallback for client routes
  }
  try {
    const body = await readFile(file);
    const immutable = file.includes(`${DIST}/assets/`);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    json(res, 404, { error: 'not found' });
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://x');
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'read-only' });

  if (pathname === '/api/health') return json(res, dbOk ? 200 : 503, health());
  if (pathname === '/api/quests') return json(res, 200, quests);
  if (pathname === '/api/summary') return json(res, 200, summarize(quests));
  if (pathname === '/api/snapshot') return json(res, 200, snapshot());
  if (pathname === '/api/streaming') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n');
    res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot())}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (pathname.startsWith('/api/')) return json(res, 404, { error: 'unknown endpoint' });
  return serveStatic(req, res, pathname);
});

setInterval(() => { for (const res of clients) res.write(': heartbeat\n\n'); }, 15_000).unref();
setInterval(poll, POLL_MS).unref();
await poll();
server.listen(PORT, HOST, () => console.log(`[exnovo] http://${HOST}:${PORT}  dist=${DIST}  db=${dbOk ? 'up' : 'down'}`));

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); pool.end().finally(() => process.exit(0)); });
