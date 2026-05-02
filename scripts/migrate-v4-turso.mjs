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
  // Add identityStatement to User (idempotent: ignore if column exists)
  `ALTER TABLE "User" ADD COLUMN "identityStatement" TEXT`,

  // Habit table
  `CREATE TABLE IF NOT EXISTS "Habit" (
    "id"                  TEXT NOT NULL PRIMARY KEY,
    "title"               TEXT NOT NULL,
    "identityStatement"   TEXT,
    "twoMinuteStarter"    TEXT,
    "implementationWhen"  TEXT,
    "implementationWhere" TEXT,
    "userId"              TEXT NOT NULL,
    "createdAt"           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Habit_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,

  // HabitLog table
  `CREATE TABLE IF NOT EXISTS "HabitLog" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "habitId"   TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "date"      TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitLog_habitId_fkey"
      FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE
  )`,

  // Unique index on habitId + date
  `CREATE UNIQUE INDEX IF NOT EXISTS "HabitLog_habitId_date_key"
    ON "HabitLog"("habitId","date")`,
];

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log('OK:', sql.slice(0, 60).replace(/\s+/g, ' ').trim());
  } catch (err) {
    // Swallow "duplicate column" errors for idempotent ALTER TABLE
    if (err.message?.includes('duplicate column')) {
      console.log('SKIP (already exists):', sql.slice(0, 60).replace(/\s+/g, ' ').trim());
    } else {
      console.error('ERROR:', err.message);
      process.exit(1);
    }
  }
}

console.log('\nMigration v4 complete.');
client.close?.();
