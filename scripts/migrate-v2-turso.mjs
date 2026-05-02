import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const steps = [
  // Recreate User table without googleId, with passwordHash
  `CREATE TABLE IF NOT EXISTS "User_new" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "email"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "avatar"       TEXT,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT INTO "User_new"(id, email, name, createdAt, updatedAt)
     SELECT id, email, name, createdAt, updatedAt FROM "User"`,
  `DROP TABLE "User"`,
  `ALTER TABLE "User_new" RENAME TO "User"`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

  // Add priority + dueDate to Todo
  `ALTER TABLE "Todo" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'medium'`,
  `ALTER TABLE "Todo" ADD COLUMN "dueDate" DATETIME`,
];

for (const sql of steps) {
  try {
    await client.execute(sql);
    console.log('OK:', sql.split('\n')[0].trim().slice(0, 70));
  } catch (e) {
    if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
      console.log('SKIP (already applied):', sql.split('\n')[0].trim().slice(0, 60));
    } else {
      console.error('FAIL:', e.message);
      process.exit(1);
    }
  }
}

console.log('\nMigration v2 complete.');
client.close();
