import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import { config } from '@core/env';

const dbPath = resolve(config.database.path);
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath, { create: true });
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite);
export const rawSqlite = sqlite;
