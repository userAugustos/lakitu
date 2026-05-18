import { edenTreaty } from '@elysiajs/eden';

import type { LakituApi } from '@lakitu/api/client';

const _client = edenTreaty<LakituApi>('http://localhost:3000');

export type _HealthzReturn = Awaited<ReturnType<typeof _client.healthz.get>>;
