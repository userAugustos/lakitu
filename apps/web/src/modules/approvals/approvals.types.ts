import type { PendingAction, PendingActionStatusValue } from '@lakitu/api/pending-actions';

export interface ApprovalsContext {
  selectedAction: PendingAction | null;
  statusFilter: PendingActionStatusValue | undefined;
  simulateOpen: boolean;
  error: { message: string } | null;
}

export type ApprovalsEvent =
  | { type: 'SELECT'; pendingAction: PendingAction }
  | { type: 'BACK' }
  | { type: 'SET_FILTER'; status: PendingActionStatusValue | undefined }
  | { type: 'APPROVE'; note?: string }
  | { type: 'DENY'; note?: string }
  | { type: 'OPEN_SIMULATE' }
  | { type: 'CLOSE_SIMULATE' }
  | {
      type: 'SUBMIT_SIMULATE';
      agent_id: string;
      action: string;
      context?: Record<string, unknown>;
    };
