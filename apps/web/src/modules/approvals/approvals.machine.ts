import { assign, fromPromise, setup } from 'xstate';

import type { PendingAction } from '@lakitu/api/pending-actions';

import { apiCall, lakituAuthApi } from '@/api';
import { queryClient } from '@/main';

import type { ApprovalsContext, ApprovalsEvent } from './approvals.types';

export const approvalsMachine = setup({
  types: {} as {
    context: ApprovalsContext;
    events: ApprovalsEvent;
  },
  actors: {
    approveActor: fromPromise(async ({ input }: { input: { id: string; note?: string } }) => {
      return apiCall<PendingAction>(() =>
        lakituAuthApi['pending-actions'][input.id]!.approve.post({ note: input.note })
      );
    }),

    denyActor: fromPromise(async ({ input }: { input: { id: string; note?: string } }) => {
      return apiCall<PendingAction>(() =>
        lakituAuthApi['pending-actions'][input.id]!.deny.post({ note: input.note })
      );
    }),

    simulateActor: fromPromise(
      async ({
        input,
      }: {
        input: { agent_id: string; action: string; context?: Record<string, unknown> };
      }) => {
        return apiCall<PendingAction>(() =>
          lakituAuthApi['pending-actions'].simulate.post({
            agent_id: input.agent_id,
            action: input.action,
            context: input.context ?? {},
          })
        );
      }
    ),
  },
  actions: {
    invalidateList: () => {
      void queryClient.invalidateQueries({ queryKey: ['pending-actions'] });
    },
  },
}).createMachine({
  id: 'approvals',
  initial: 'list',
  context: {
    selectedAction: null,
    statusFilter: undefined,
    simulateOpen: false,
    error: null,
  },

  states: {
    list: {
      entry: assign({ error: null }),
      on: {
        SELECT: {
          target: 'detail',
          actions: assign(({ event }) => ({ selectedAction: event.pendingAction })),
        },
        SET_FILTER: {
          actions: assign(({ event }) => ({ statusFilter: event.status })),
        },
        OPEN_SIMULATE: {
          actions: assign({ simulateOpen: true }),
        },
        CLOSE_SIMULATE: {
          actions: assign({ simulateOpen: false }),
        },
        SUBMIT_SIMULATE: 'simulating',
      },
    },

    detail: {
      entry: assign({ error: null }),
      on: {
        BACK: {
          target: 'list',
          actions: assign({ selectedAction: null }),
        },
        APPROVE: 'approving',
        DENY: 'denying',
      },
    },

    approving: {
      invoke: {
        src: 'approveActor',
        input: ({ context, event }) => ({
          id: context.selectedAction!.id,
          note: (event as { type: 'APPROVE'; note?: string }).note,
        }),
        onDone: {
          target: 'list',
          actions: [assign({ selectedAction: null, error: null }), 'invalidateList'],
        },
        onError: {
          target: 'detail',
          actions: assign(({ event }) => ({
            error: {
              message: (event.error as Error).message ?? 'Failed to approve',
            },
          })),
        },
      },
    },

    denying: {
      invoke: {
        src: 'denyActor',
        input: ({ context, event }) => ({
          id: context.selectedAction!.id,
          note: (event as { type: 'DENY'; note?: string }).note,
        }),
        onDone: {
          target: 'list',
          actions: [assign({ selectedAction: null, error: null }), 'invalidateList'],
        },
        onError: {
          target: 'detail',
          actions: assign(({ event }) => ({
            error: {
              message: (event.error as Error).message ?? 'Failed to deny',
            },
          })),
        },
      },
    },

    simulating: {
      invoke: {
        src: 'simulateActor',
        input: ({ event }) => {
          const e = event as {
            type: 'SUBMIT_SIMULATE';
            agent_id: string;
            action: string;
            context?: Record<string, unknown>;
          };
          return { agent_id: e.agent_id, action: e.action, context: e.context };
        },
        onDone: {
          target: 'list',
          actions: [assign({ simulateOpen: false, error: null }), 'invalidateList'],
        },
        onError: {
          target: 'list',
          actions: assign(({ event }) => ({
            simulateOpen: true,
            error: {
              message: (event.error as Error).message ?? 'Failed to simulate',
            },
          })),
        },
      },
    },
  },
});
