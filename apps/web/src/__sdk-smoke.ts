import { edenTreaty } from '@elysiajs/eden';

import type { Agent as _Agent } from '@lakitu/api/agents';
import type { AuditLogEntry as _AuditLogEntry } from '@lakitu/api/audit-log';
import type { LakituApi } from '@lakitu/api/client';
import type { Company } from '@lakitu/api/companies';
import type { OnboardingStatus as _OnboardingStatus } from '@lakitu/api/onboarding';

const _client = edenTreaty<LakituApi>('http://localhost:3000');

export type _HealthzReturn = Awaited<ReturnType<typeof _client.healthz.get>>;
export type _CompanyCheck = Company;
export type _AgentCheck = _Agent;
