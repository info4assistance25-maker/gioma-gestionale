# GioMà · Gestionale tavoli (demo)

Pagina statica (`index.html`) + API su Vercel (`api/gestionale.js`) con stato su Neon Postgres.

## Setup
1. Collegare Neon al progetto Vercel (Storage → Neon): imposta `DATABASE_URL`.
2. Redeploy. La tabella `gioma_stato` si crea da sola al primo utilizzo.

## API (GET con query oppure POST JSON) `/api/gestionale`
`azione`: `stato`, `reset`, `disponibilita`, `prenota`, `richiesta`, `conferma` (id), `elimina` (id).
Campi: `data` (AAAA-MM-GG), `ora` (HH:MM), `persone`, `nome`, `telefono`.
Le azioni del bot rispondono in testo (`esito=...`), le altre in JSON.

## Test
`npm test` (logica e concorrenza, senza database).
