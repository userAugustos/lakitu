import type { Agent } from '@lakitu/api/agents';
import type { AgentPermission } from '@lakitu/api/permissions';

export type CreateAgentScreen = 'naming' | 'creating' | 'permissions' | 'clawkey' | 'done';

export interface CreateAgentContext {
  screen: CreateAgentScreen;
  name: string;
  agent: Agent | null;
  privateKey: string | null;
  registrationUrl: string | null;
  grantedPermissions: AgentPermission[];
  error: { message: string } | null;
}

export type CreateAgentEvent =
  | { type: 'SUBMIT_NAME'; name: string }
  | {
      type: 'ADD_PERMISSION';
      toolKey: string;
      policyLimits?: Record<string, unknown> | null;
      autoApprove?: boolean;
    }
  | { type: 'REMOVE_PERMISSION'; toolKey: string }
  | { type: 'CONTINUE' }
  | { type: 'CONFIRM' }
  | { type: 'BYPASS_CLAWKEY' };
