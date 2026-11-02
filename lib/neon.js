import { neon } from '@neondatabase/serverless';

export function neonStore(url) {
  if (!url) throw new Error('DATABASE_URL mancante: collega il database Neon al progetto Vercel');
  const sql = neon(url);
  let ready = null;
  const init = () => ready || (ready = sql`CREATE TABLE IF NOT EXISTS gioma_stato (id text PRIMARY KEY, data jsonb NOT NULL, version int NOT NULL DEFAULT 1)`);
  return {
    async load() {
      await init();
      const r = await sql`SELECT data, version FROM gioma_stato WHERE id = 'stato'`;
      return r.length ? { S: r[0].data, version: r[0].version } : null;
    },
    async save(S, version) {
      await init();
      const json = JSON.stringify(S);
      if (version == null) {
        const r = await sql`INSERT INTO gioma_stato (id, data, version) VALUES ('stato', ${json}::jsonb, 1) ON CONFLICT (id) DO NOTHING RETURNING version`;
        return r.length > 0;
      }
      const r = await sql`UPDATE gioma_stato SET data = ${json}::jsonb, version = version + 1 WHERE id = 'stato' AND version = ${version} RETURNING version`;
      return r.length > 0;
    },
  };
}
