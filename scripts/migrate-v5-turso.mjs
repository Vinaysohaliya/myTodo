import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const statements = [
  `ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log('OK:', sql.slice(0, 70).replace(/\s+/g, ' ').trim());
  } catch (err) {
    if (err.message?.includes('duplicate column')) {
      console.log('SKIP (already exists):', sql.slice(0, 70).replace(/\s+/g, ' ').trim());
    } else {
      console.error('ERROR:', err.message);
      process.exit(1);
    }
  }
}

console.log('\nMigration v5 complete.');
client.close?.();
