import type { PendingAction } from '@lakitu/api/pending-actions';

export interface ApprovalsContext {
  selectedAction: PendingAction | null;
  simulateOpen: boolean;
  error: { message: string } | null;
}

export type ApprovalsEvent =
  | { type: 'SELECT'; pendingAction: PendingAction }
  | { type: 'BACK' }
  | { type: 'APPROVE'; note?: string }
  | { type: 'DENY'; note?: string }
  | { type: 'OPEN_SIMULATE' }
  | { type: 'CLOSE_SIMULATE' }
  | {
      type: 'SUBMIT_SIMULATE';
      agent_id: string;
      tool_key: string;
      context?: Record<string, unknown>;
    };
