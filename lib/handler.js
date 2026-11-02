import { nowR, run } from './logic.js';

function parseInput(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  return { ...(req.query || {}), ...body };
}

export function createHandler(store) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
    try {
      const input = parseInput(req);
      for (let i = 0; i < 6; i++) {
        const cur = await store.load();
        const n = nowR();
        const r = run(cur ? cur.S : null, input, n);
        if (r.write) {
          const ok = await store.save(r.S, cur ? cur.version : null);
          if (!ok) continue; // conflitto: ricarica e riprova
        }
        if (r.bot) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.statusCode = 200; res.end(r.testo);
        } else {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 200; res.end(JSON.stringify({ ok: true, msg: r.testo, adesso: n, stato: r.S }));
        }
        return;
      }
      res.statusCode = 500; res.end('esito=errore_conflitto');
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('esito=errore_server,motivo=' + String(e && e.message || e).slice(0, 200));
    }
  };
}
