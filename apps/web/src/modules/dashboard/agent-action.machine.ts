import { assign, fromPromise, setup } from 'xstate';

import type { Agent, RotateKeyResponse } from '@lakitu/api/agents';

import { apiCall, lakituAuthApi } from '@/api';
import { queryClient } from '@/main';

import type { AgentActionContext, AgentActionEvent, AgentActionKind } from './agent-action.types';

const executeAction = fromPromise(
  async ({ input }: { input: { kind: AgentActionKind; agentId: string } }) => {
    const { kind, agentId } = input;
    switch (kind) {
      case 'revoke':
        return apiCall<Agent>(() => lakituAuthApi.agents[agentId]!.revoke.patch());
      case 'restore':
        return apiCall<Agent>(() => lakituAuthApi.agents[agentId]!.restore.patch());
      case 'rotate-key':
        return apiCall<RotateKeyResponse>(() =>
          lakituAuthApi.agents[agentId]!['rotate-key'].post()
        );
    }
  }
);

export const agentActionMachine = setup({
  types: {} as {
    context: AgentActionContext;
    events: AgentActionEvent;
  },
  actors: { executeAction },
}).createMachine({
  id: 'agentAction',
  initial: 'idle',
  context: {
    input: null,
    rotateResult: null,
    error: null,
  },

  states: {
    idle: {
      on: {
        START: {
          target: 'confirming',
          actions: assign(({ event }) => ({
            input: { kind: event.kind, agentId: event.agentId, agentName: event.agentName },
            rotateResult: null,
            error: null,
          })),
        },
      },
    },

    confirming: {
      on: {
        CONFIRM: 'executing',
        CANCEL: {
          target: 'idle',
          actions: assign({ input: null, error: null }),
        },
      },
    },

    executing: {
      invoke: {
        src: 'executeAction',
        input: ({ context }) => ({
          kind: context.input!.kind,
          agentId: context.input!.agentId,
        }),
        onDone: [
          {
            guard: ({ context }) => context.input!.kind === 'rotate-key',
            target: 'showingResult',
            actions: [
              assign(({ event }) => ({ rotateResult: event.output as RotateKeyResponse })),
              () => void queryClient.invalidateQueries({ queryKey: ['agents'] }),
            ],
          },
          {
            target: 'success',
            actions: () => void queryClient.invalidateQueries({ queryKey: ['agents'] }),
          },
        ],
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: (event.error as Error).message ?? 'Action failed',
          })),
        },
      },
    },

    success: {
      after: { 0: 'idle' },
    },

    showingResult: {
      on: {
        DISMISS: {
          target: 'idle',
          actions: assign({ input: null, rotateResult: null }),
        },
      },
    },

    error: {
      on: {
        CONFIRM: 'executing',
        CANCEL: {
          target: 'idle',
          actions: assign({ input: null, error: null }),
        },
      },
    },
  },
});
