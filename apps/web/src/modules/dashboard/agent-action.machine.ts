import { assign, fromPromise, setup } from 'xstate';

import type { Agent } from '@lakitu/api/agents';

import { apiCall, lakituAuthApi } from '@/api';
import { queryClient } from '@/main';

import type { AgentActionContext, AgentActionEvent } from './agent-action.types';

const executeAction = fromPromise(
  async ({ input }: { input: { kind: 'revoke' | 'restore'; agentId: string } }) => {
    const { kind, agentId } = input;
    switch (kind) {
      case 'revoke':
        return apiCall<Agent>(() => lakituAuthApi.agents[agentId]!.revoke.patch());
      case 'restore':
        return apiCall<Agent>(() => lakituAuthApi.agents[agentId]!.restore.patch());
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
    error: null,
  },

  states: {
    idle: {
      on: {
        START: {
          target: 'confirming',
          actions: assign(({ event }) => ({
            input: { kind: event.kind, agentId: event.agentId, agentName: event.agentName },
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
          kind: context.input!.kind as 'revoke' | 'restore',
          agentId: context.input!.agentId,
        }),
        onDone: {
          target: 'success',
          actions: () => void queryClient.invalidateQueries({ queryKey: ['agents'] }),
        },
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
