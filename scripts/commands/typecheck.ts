import { existsSync } from 'fs';
import { resolve } from 'path';

import { $ } from 'bun';

$.env({ ...process.env, FORCE_COLOR: '1' });

const workspaces: Array<{ filter: string; path: string }> = [
  { filter: '@lakitu/api', path: 'packages/api' },
  { filter: 'web', path: 'apps/web' },
];

const runTypecheck = async ({ filter, path }: { filter: string; path: string }) => {
  if (!existsSync(resolve(path, 'package.json'))) return;
  await $`bun run --filter ${filter} typecheck`;
};

const results = await Promise.allSettled(workspaces.map(runTypecheck));

if (results.some((r) => r.status === 'rejected')) process.exit(1);
