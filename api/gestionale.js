import { createHandler } from '../lib/handler.js';
import { neonStore } from '../lib/neon.js';

let handler;
export default async function (req, res) {
  if (!handler) {
    try { handler = createHandler(neonStore(process.env.DATABASE_URL || process.env.POSTGRES_URL)); }
    catch (e) { res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('esito=errore_server,motivo=' + e.message); return; }
  }
  return handler(req, res);
}
