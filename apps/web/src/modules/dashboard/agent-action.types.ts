import type { RotateKeyResponse } from '@lakitu/api/agents';

export type AgentActionKind = 'revoke' | 'restore' | 'rotate-key';

export interface AgentActionInput {
  agentId: string;
  agentName: string;
  kind: AgentActionKind;
}

export interface AgentActionContext {
  input: AgentActionInput | null;
  result: RotateKeyResponse | null;
  error: string | null;
}

export type AgentActionEvent =
  | { type: 'START'; kind: AgentActionKind; agentId: string; agentName: string }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL' }
  | { type: 'DISMISS' };
