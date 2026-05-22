export type AgentActionKind = 'revoke' | 'restore' | 'rotate-key';

export interface AgentActionInput {
  agentId: string;
  agentName: string;
  kind: AgentActionKind;
}

export interface AgentActionContext {
  input: AgentActionInput | null;
  error: string | null;
}

export type AgentActionEvent =
  | { type: 'START'; kind: AgentActionKind; agentId: string; agentName: string }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL' };
