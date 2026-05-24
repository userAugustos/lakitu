import { edenTreaty } from '@elysiajs/eden';

import type { Agent as _Agent } from '@lakitu/api/agents';
import type {
  AuditLogEntry as _AuditLogEntry,
  VerifyChainResponse as _VerifyChainResponse,
} from '@lakitu/api/audit-log';
import type { LakituApi } from '@lakitu/api/client';
import type { MyCompanyResponse as _MyCompanyResponse, Company } from '@lakitu/api/companies';
import type { GatewayDecision as _GatewayDecision } from '@lakitu/api/gateway';
import type { OnboardingStatus as _OnboardingStatus } from '@lakitu/api/onboarding';
import type { PendingAction as _PendingAction } from '@lakitu/api/pending-actions';
import type { AgentPermission as _AgentPermission } from '@lakitu/api/permissions';
import type { Tool as _Tool } from '@lakitu/api/tools';

const _client = edenTreaty<LakituApi>('http://localhost:3000');

export type _HealthzReturn = Awaited<ReturnType<typeof _client.healthz.get>>;
export type _CompanyCheck = Company;
export type _AgentCheck = _Agent;
export type _PendingActionCheck = _PendingAction;
export type _AgentPermissionCheck = _AgentPermission;
export type _ToolCheck = _Tool;
export type _VerifyChainCheck = _VerifyChainResponse;
