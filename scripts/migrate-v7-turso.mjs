import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url:       process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function migrate() {
  console.log('Running v7 migration: add focusSessions column...');
  try {
    await client.execute(`ALTER TABLE "User" ADD COLUMN "focusSessions" INTEGER DEFAULT 0 NOT NULL`);
    console.log('✓ focusSessions column added');
  } catch (e) {
    if (e.message?.includes('duplicate column')) {
      console.log('  focusSessions column already exists, skipping');
    } else {
      throw e;
    }
  }
  console.log('Migration v7 complete.');
}

migrate().catch(err => { console.error(err); process.exit(1); });
