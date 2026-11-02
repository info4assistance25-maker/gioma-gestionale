export const TZ = 'Europe/Rome';
export const DUR = 120;
export const TAV = [
  { id: 'T1', nome: 'Tavolo 1', cap: 2 }, { id: 'T2', nome: 'Tavolo 2', cap: 2 },
  { id: 'T3', nome: 'Tavolo 3', cap: 4 }, { id: 'T4', nome: 'Tavolo 4', cap: 4 },
  { id: 'T5', nome: 'Tavolo 5', cap: 4 }, { id: 'T6', nome: 'Tavolo 6', cap: 6 },
  { id: 'T7', nome: 'Tavolo 7', cap: 6 }, { id: 'T8', nome: 'Tavolo 8', cap: 8 },
];
export const ORARI = ['12:00', '12:30', '13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

export function nowR(d = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const p = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  const h = p.hour === '24' ? '00' : p.hour;
  return { data: p.year + '-' + p.month + '-' + p.day, ora: h + ':' + p.minute + ':' + p.second };
}
const addD = (ds, n) => { const q = ds.split('-').map(Number); return new Date(Date.UTC(q[0], q[1] - 1, q[2] + n)).toISOString().slice(0, 10); };
const dow = (ds) => { const q = ds.split('-').map(Number); return new Date(Date.UTC(q[0], q[1] - 1, q[2])).getUTCDay(); };
const mins = (o) => { const q = o.split(':').map(Number); return q[0] * 60 + q[1]; };
const fd = (ds) => { const q = ds.split('-'); return q[2] + '/' + q[1] + '/' + q[0]; };

function normData(s) {
  s = String(s || '').trim().slice(0, 10).split('/').join('-').split('.').join('-');
  const q = s.split('-');
  if (q.length !== 3 || q.some((x) => isNaN(Number(x)) || x === '')) return '';
  let y, m, d;
  if (q[0].length === 4) { y = q[0]; m = q[1]; d = q[2]; } else { d = q[0]; m = q[1]; y = q[2]; }
  return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0');
}
function normOra(s) {
  s = String(s || '').trim().split('.').join(':').split('h').join(':');
  if (s.indexOf(':') < 0) { if (s.length >= 3) s = s.slice(0, -2) + ':' + s.slice(-2); else s = s + ':00'; }
  const q = s.split(':');
  if (isNaN(Number(q[0])) || q[0] === '') return '';
  return q[0].padStart(2, '0') + ':' + (q[1] || '00').padStart(2, '0');
}
const cleanTel = (s) => String(s || '').split('').filter((c) => '+0123456789'.indexOf(c) >= 0).join('');
const cap = (s) => String(s || '').trim().slice(0, 60).split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

export function seed(n) {
  const k = (6 - dow(n.data) + 7) % 7;
  const sab = addD(n.data, k), ven = addD(sab, -1), dom = addD(sab, 1);
  const S = { tavoli: TAV, orari: ORARI, durata: DUR, seq: 0, prenotazioni: [], log: [], verifica: null, ultimo: null };
  const b = (data, ora, tav, nome, tel, pers, stato, fonte) => { S.seq++; S.prenotazioni.push({ id: 'P' + S.seq, nome, tel, data, ora, persone: pers, stato, tavolo: tav, fonte }); };
  b(sab, '19:30', 'T8', 'Famiglia Bianchi', '3394410021', 8, 'Confermata', 'Telefono');
  b(sab, '20:00', 'T6', 'Ferrari', '3472210098', 6, 'Confermata', 'Telefono');
  b(sab, '20:00', 'T7', 'Conti', '3315503412', 5, 'Confermata', 'Telefono');
  b(sab, '20:30', 'T3', 'Russo', '3208841177', 4, 'Confermata', 'Telefono');
  b(sab, '21:00', 'T5', 'Esposito', '3386620145', 4, 'Confermata', 'Telefono');
  b(sab, '20:00', 'T1', 'Greco', '3491103388', 2, 'Confermata', 'Telefono');
  b(sab, '21:00', 'T2', 'Moretti', '3357709921', 2, 'Confermata', 'Telefono');
  b(sab, '20:00', '', 'Lucia Gallo', '3405567012', 2, 'Da confermare', 'AI');
  b(ven, '20:00', 'T3', 'Romano', '3382210456', 4, 'Confermata', 'Telefono');
  b(ven, '20:30', 'T6', 'Colombo', '3319987120', 6, 'Confermata', 'Telefono');
  b(ven, '21:00', 'T1', 'Fabbri', '3476650321', 2, 'Confermata', 'Telefono');
  b(dom, '12:30', 'T8', 'Gatti', '3355541200', 7, 'Confermata', 'Telefono');
  b(dom, '19:30', 'T2', 'De Luca', '3283307755', 2, 'Confermata', 'Telefono');
  b(dom, '20:00', 'T4', 'Barbieri', '3396612044', 3, 'Confermata', 'Telefono');
  b(dom, '13:00', '', 'Sara Villa', '3487712390', 4, 'Da confermare', 'AI');
  return S;
}

const conflict = (S, data, ora, tav) => { const m = mins(ora); return S.prenotazioni.some((p) => p.stato === 'Confermata' && p.tavolo === tav && p.data === data && Math.abs(mins(p.ora) - m) < DUR); };
function libero(S, data, ora, pers) {
  const c = S.tavoli.filter((t) => t.cap >= pers).sort((a, b) => a.cap - b.cap);
  for (const t of c) if (!conflict(S, data, ora, t.id)) return t.id;
  return null;
}
function alt(S, data, ora, pers) {
  const m = mins(ora);
  return ORARI.filter((o) => o !== ora && (mins(o) < 900) === (m < 900) && libero(S, data, o, pers))
    .sort((a, b) => Math.abs(mins(a) - m) - Math.abs(mins(b) - m)).slice(0, 2).sort();
}
const altTxt = (al) => al.map((o, i) => ',alt' + (i + 1) + '=' + o).join('');

/** Applica un'azione allo stato. Ritorna { S, testo, bot, write }. */
export function run(Sin, input, n) {
  const A = String(input.azione || 'stato').toLowerCase().trim();
  let S = Sin && Sin.tavoli ? Sin : null;
  let testo = '';
  let write = A !== 'stato';
  if (!S || A === 'reset') {
    S = seed(n);
    S.log.push({ t: n.ora, tipo: 'sys', testo: 'Dati demo ripristinati' });
    if (A === 'reset') testo = 'esito=reset_ok';
    write = true;
  }
  const data = normData(input.data), ora = normOra(input.ora), pers = parseInt(input.persone, 10) || 0;
  const nome = cap(input.nome), tel = cleanTel(input.telefono);
  const lg = (tipo, t) => { S.log.push({ t: n.ora, tipo, testo: t }); if (S.log.length > 40) S.log.shift(); };
  const check = () => {
    if (!data) return 'data_non_valida';
    if (data < n.data) return 'data_passata';
    if (ORARI.indexOf(ora) < 0) return 'orario_non_valido';
    if (pers < 1) return 'persone_mancanti';
    if (pers > 8) return 'gruppo_numeroso';
    return '';
  };
  const desc = data ? fd(data) + ' ore ' + ora + ', ' + pers + ' pers.' : '';

  if (A === 'disponibilita' || A === 'prenota' || A === 'richiesta') {
    const err = check();
    if (err) { testo = 'esito=' + err; lg('ai', 'Richiesta non valida: ' + err); }
    else if (A === 'disponibilita') {
      const t = libero(S, data, ora, pers);
      S.verifica = { data, ora, persone: pers, tavolo: t, ok: !!t, ts: n.ora };
      if (t) { testo = 'esito=disponibile,data=' + data + ',ora=' + ora + ',persone=' + pers; lg('ai', 'Verifica disponibilita ' + desc + ' : tavolo libero'); }
      else { const al = alt(S, data, ora, pers); testo = 'esito=non_disponibile' + altTxt(al); lg('ai', 'Verifica disponibilita ' + desc + ' : completo' + (al.length ? ', alternative ' + al.join(' / ') : '')); }
    } else if (!nome) testo = 'esito=dati_mancanti,campo=nome';
    else if (!tel) testo = 'esito=dati_mancanti,campo=telefono';
    else if (A === 'richiesta') {
      S.seq++; const id = 'P' + S.seq;
      S.prenotazioni.push({ id, nome, tel, data, ora, persone: pers, stato: 'Da confermare', tavolo: '', fonte: 'AI' });
      S.ultimo = id;
      testo = 'esito=registrata,nome=' + nome + ',data=' + data + ',ora=' + ora + ',persone=' + pers;
      lg('ai', 'Richiesta registrata (da confermare): ' + nome + ', ' + desc);
    } else {
      const dup = S.prenotazioni.find((p) => p.nome === nome && p.tel === tel && p.data === data && p.ora === ora && p.stato === 'Confermata');
      if (dup) { S.ultimo = dup.id; testo = 'esito=confermata,nome=' + nome + ',data=' + data + ',ora=' + ora + ',persone=' + dup.persone; }
      else {
        const t = libero(S, data, ora, pers);
        if (!t) {
          const al = alt(S, data, ora, pers);
          S.verifica = { data, ora, persone: pers, tavolo: null, ok: false, ts: n.ora };
          testo = 'esito=non_disponibile' + altTxt(al);
          lg('ai', 'Prenotazione non possibile ' + desc + ' : completo');
        } else {
          S.seq++; const id = 'P' + S.seq;
          S.prenotazioni.push({ id, nome, tel, data, ora, persone: pers, stato: 'Confermata', tavolo: t, fonte: 'AI' });
          S.ultimo = id;
          S.verifica = { data, ora, persone: pers, tavolo: t, ok: true, ts: n.ora };
          testo = 'esito=confermata,nome=' + nome + ',data=' + data + ',ora=' + ora + ',persone=' + pers;
          lg('ai', 'Prenotazione confermata: ' + nome + ', ' + desc + ' - assegnato ' + t);
        }
      }
    }
  } else if (A === 'conferma') {
    const p = S.prenotazioni.find((x) => x.id === String(input.id));
    if (!p) testo = 'esito=non_trovata';
    else {
      const t = p.stato === 'Confermata' ? p.tavolo : libero(S, p.data, p.ora, p.persone);
      if (!t) testo = 'esito=nessun_tavolo';
      else { p.stato = 'Confermata'; p.tavolo = t; S.ultimo = p.id; testo = 'esito=ok'; lg('sys', 'Confermata dal personale: ' + p.nome + ' - ' + t); }
    }
  } else if (A === 'elimina') {
    const l = S.prenotazioni.length;
    S.prenotazioni = S.prenotazioni.filter((x) => x.id !== String(input.id));
    testo = l > S.prenotazioni.length ? 'esito=ok' : 'esito=non_trovata';
    if (testo === 'esito=ok') lg('sys', 'Prenotazione eliminata');
  }
  return { S, testo, bot: ['disponibilita', 'prenota', 'richiesta'].indexOf(A) >= 0, write };
}
