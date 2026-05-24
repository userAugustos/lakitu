import type { Agent } from '@lakitu/api/agents';

export type CreateAgentScreen = 'naming' | 'creating' | 'permissions' | 'clawkey' | 'done';

export interface CreateAgentContext {
  screen: CreateAgentScreen;
  name: string;
  agent: Agent | null;
  privateKey: string | null;
  registrationUrl: string | null;
  error: { message: string } | null;
}

export type CreateAgentEvent =
  | { type: 'SUBMIT_NAME'; name: string }
  | { type: 'CONTINUE' }
  | { type: 'CONFIRM' }
  | { type: 'BYPASS_CLAWKEY' };
