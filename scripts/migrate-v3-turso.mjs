import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const steps = [
  `ALTER TABLE "User" ADD COLUMN "currentStreak"     INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "User" ADD COLUMN "longestStreak"     INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "User" ADD COLUMN "lastCompletedDate" TEXT`,
  `ALTER TABLE "User" ADD COLUMN "dailyGoal"         INTEGER NOT NULL DEFAULT 3`,
  `ALTER TABLE "User" ADD COLUMN "totalCompleted"    INTEGER NOT NULL DEFAULT 0`,
];

for (const sql of steps) {
  try {
    await client.execute(sql);
    console.log('OK:', sql.trim().slice(0, 70));
  } catch (e) {
    if (e.message?.includes('duplicate column')) {
      console.log('SKIP (already applied):', sql.trim().slice(0, 60));
    } else {
      console.error('FAIL:', e.message);
      process.exit(1);
    }
  }
}

console.log('\nMigration v3 complete.');
client.close();
