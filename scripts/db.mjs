// Local Postgres for development: a real Postgres 17 in ./.pgdata, no install needed.
// dev only; production points DATABASE_URL at Neon/Supabase.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
const pg = new EmbeddedPostgres({ databaseDir: './.pgdata', user: 'setspace', password: 'setspace', port: 5433, persistent: true });
if (!existsSync('./.pgdata/PG_VERSION')) await pg.initialise();
await pg.start();
try { await pg.createDatabase('setspace'); } catch {}
console.log('postgres ready on 5433');
process.on('SIGINT', async () => { await pg.stop(); process.exit(0); });
