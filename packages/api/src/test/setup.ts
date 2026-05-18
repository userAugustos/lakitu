import { rmSync } from 'fs';
import { resolve } from 'path';

const dbPath = Bun.env.SQLITE_PATH ?? './data/lakitu-test.db';
const absolute = resolve(dbPath);

for (const suffix of ['', '-shm', '-wal', '-journal']) {
  try {
    rmSync(`${absolute}${suffix}`, { force: true });
  } catch {
    // ignore — file may not exist
  }
}
