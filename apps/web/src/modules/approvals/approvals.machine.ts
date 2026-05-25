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
        input: { agent_id: string; tool_key: string; context?: Record<string, unknown> };
      }) => {
        // Dev-only route — conditional Elysia plugin makes Eden type a union
        const simulate = (lakituAuthApi['pending-actions'] as Record<string, unknown>).simulate as {
          post: (
            ...args: unknown[]
          ) => Promise<{ data: unknown; error: null } | { data: null; error: unknown }>;
        };
        return apiCall<PendingAction>(() =>
          simulate.post({
            agent_id: input.agent_id,
            tool_key: input.tool_key,
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
    simulateOpen: false,
    error: null,
  },

  states: {
    list: {
      on: {
        SELECT: {
          target: 'detail',
          actions: assign(({ event }) => ({ selectedAction: event.pendingAction, error: null })),
        },
        OPEN_SIMULATE: {
          actions: assign({ simulateOpen: true, error: null }),
        },
        CLOSE_SIMULATE: {
          actions: assign({ simulateOpen: false }),
        },
        SUBMIT_SIMULATE: 'simulating',
      },
    },

    detail: {
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
      entry: assign({ error: null }),
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
      entry: assign({ error: null }),
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
      entry: assign({ error: null }),
      invoke: {
        src: 'simulateActor',
        input: ({ event }) => {
          const e = event as {
            type: 'SUBMIT_SIMULATE';
            agent_id: string;
            tool_key: string;
            context?: Record<string, unknown>;
          };
          return { agent_id: e.agent_id, tool_key: e.tool_key, context: e.context };
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
