import assert from 'node:assert/strict';
import { createHandler } from '../lib/handler.js';

let cur = null, saves = 0;
const store = {
  async load() { return cur ? { S: JSON.parse(JSON.stringify(cur.S)), version: cur.version } : null; },
  async save(S, v) {
    if (v == null ? cur !== null : (cur === null || cur.version !== v)) return false;
    cur = { S: JSON.parse(JSON.stringify(S)), version: (v || 0) + 1 }; saves++; return true;
  },
};
const h = createHandler(store);
async function call(q, method = 'GET') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await h(method === 'GET' ? { method, query: q } : { method, body: q }, res);
  return res;
}
const txt = async (q, m) => (await call(q, m)).body;
const sab = '2026-11-07';

let r = await call({ azione: 'stato' });
assert.equal(JSON.parse(r.body).stato.prenotazioni.length, 15, 'seed');
const s0 = saves;
await call({ azione: 'stato' }); await call({ azione: 'stato' });
assert.equal(saves, s0, 'le letture non scrivono');
assert.equal(r.headers['Access-Control-Allow-Origin'], '*');

console.log(await txt({ azione: 'disponibilita', data: sab, ora: '20:30', persone: 4 }, 'POST'));
assert.match(await txt({ azione: 'disponibilita', data: sab, ora: '20:30', persone: 4 }, 'POST'), /esito=disponibile/);
assert.match(await txt({ azione: 'prenota', data: sab, ora: '20:30', persone: 4, nome: 'marco rossi', telefono: '333 1234567' }, 'POST'), /esito=confermata,nome=Marco Rossi/);
const alt = await txt({ azione: 'disponibilita', data: sab, ora: '20:30', persone: 4 }, 'POST');
console.log(alt); assert.match(alt, /esito=non_disponibile,alt1=19:00/);
assert.match(await txt({ azione: 'disponibilita', data: sab, ora: '19:00', persone: 4 }, 'POST'), /esito=disponibile/);
assert.match(await txt({ azione: 'richiesta', data: sab, ora: '21:30', persone: 3, nome: 'Anna Neri', telefono: '3471112223' }, 'POST'), /esito=registrata/);
assert.match(await txt({ azione: 'prenota', data: sab, ora: '19:00', persone: 4, nome: 'Zeno' }, 'POST'), /dati_mancanti,campo=telefono/);
assert.match(await txt({ azione: 'disponibilita', data: sab, ora: '20:30', persone: 9 }, 'POST'), /gruppo_numeroso/);
assert.match(await txt({ azione: 'disponibilita', data: '2020-01-01', ora: '20:30', persone: 2 }, 'POST'), /data_passata/);

// conferma / elimina via GET (come la pagina)
let st = JSON.parse((await call({ azione: 'conferma', id: 'P15' })).body);
assert.equal(st.msg, 'esito=ok');
const p15 = st.stato.prenotazioni.find((p) => p.id === 'P15');
assert.equal(p15.stato, 'Confermata'); assert.ok(p15.tavolo, 'tavolo assegnato');
st = JSON.parse((await call({ azione: 'elimina', id: 'P15' })).body);
assert.ok(!st.stato.prenotazioni.find((p) => p.id === 'P15'));

// concorrenza: due azioni in parallelo non si perdono
await Promise.all([
  call({ azione: 'richiesta', data: sab, ora: '19:00', persone: 2, nome: 'A', telefono: '1' }, 'POST'),
  call({ azione: 'richiesta', data: sab, ora: '19:30', persone: 2, nome: 'B', telefono: '2' }, 'POST'),
]);
st = JSON.parse((await call({ azione: 'stato' })).body).stato;
assert.ok(st.prenotazioni.find((p) => p.nome === 'A') && st.prenotazioni.find((p) => p.nome === 'B'), 'nessuna scrittura persa');

// conferma impossibile se non c'e' tavolo (Lucia Gallo, orario pieno)
assert.match((await call({ azione: 'conferma', id: 'P8' })).body, /nessun_tavolo/);

// reset
assert.equal((await txt({ azione: 'reset' })).includes('"msg":"esito=reset_ok"'), true);
st = JSON.parse((await call({ azione: 'stato' })).body).stato;
assert.equal(st.prenotazioni.length, 15);
console.log('TUTTI I TEST OK');
