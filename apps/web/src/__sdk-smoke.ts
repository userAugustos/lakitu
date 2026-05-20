import { edenTreaty } from '@elysiajs/eden';

import type { LakituApi } from '@lakitu/api/client';
import type { OnboardingStatus as _OnboardingStatus } from '@lakitu/api/onboarding';

const _client = edenTreaty<LakituApi>('http://localhost:3000');

export type _HealthzReturn = Awaited<ReturnType<typeof _client.healthz.get>>;
