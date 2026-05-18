import { beforeAll } from 'bun:test';

import { setupApi } from '@api/app';

let setupPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  await setupApi();
}

export function setupE2ETests(): void {
  beforeAll(() => {
    if (!setupPromise) setupPromise = bootstrap();
    return setupPromise;
  });
}
