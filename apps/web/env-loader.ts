import { existsSync } from 'fs';
import { resolve } from 'path';

import { config as loadEnv } from 'dotenv';

const localEnv = resolve(import.meta.dirname, '.env.local');
const testEnv = resolve(import.meta.dirname, '.env.test');
const baseEnv = resolve(import.meta.dirname, '.env');
if (existsSync(localEnv)) loadEnv({ path: localEnv });
if (process.env.NODE_ENV === 'test' && existsSync(testEnv)) loadEnv({ path: testEnv });
if (existsSync(baseEnv)) loadEnv({ path: baseEnv });

export const getWebServerPort = (): number => {
  const raw = process.env.VITE_WEB_PORT ?? process.env.WEB_PORT;
  const n = raw ? parseInt(raw, 10) : 5173;
  return Number.isFinite(n) ? n : 5173;
};
