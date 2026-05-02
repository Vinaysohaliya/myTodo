import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const DDL = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "googleId"  TEXT     NOT NULL,
    "email"     TEXT     NOT NULL,
    "name"      TEXT     NOT NULL,
    "avatar"    TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"    ON "User"("email")`,

  `CREATE TABLE IF NOT EXISTS "Todo" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "title"     TEXT     NOT NULL,
    "category"  TEXT     NOT NULL DEFAULT 'personal',
    "completed" INTEGER  NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"    TEXT     NOT NULL,
    CONSTRAINT "Todo_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "tokenHash" TEXT     NOT NULL,
    "userId"    TEXT     NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash")`,
];

for (const sql of DDL) {
  await client.execute(sql);
  console.log('OK:', sql.split('\n')[0].trim());
}

console.log('\nTurso schema migration complete.');
client.close();
