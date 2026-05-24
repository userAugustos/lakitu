import { assign, fromPromise, setup } from 'xstate';

import type { Agent, CreateAgentResponse } from '@lakitu/api/agents';

import { apiCall, lakituAuthApi } from '@/api';
import { queryClient, router } from '@/main';

import type { CreateAgentContext, CreateAgentEvent } from './create-agent.types';

export const createAgentMachine = setup({
  types: {} as {
    context: CreateAgentContext;
    events: CreateAgentEvent;
  },
  actors: {
    createAgentActor: fromPromise(async ({ input }: { input: { name: string } }) => {
      return apiCall<CreateAgentResponse>(() => lakituAuthApi.agents.post({ name: input.name }));
    }),

    bypassClawKeyActor: fromPromise(async ({ input }: { input: { agentId: string } }) => {
      return apiCall<Agent>(() => lakituAuthApi.agents[input.agentId]!.clawkey.bypass.patch());
    }),
  },
  actions: {
    navigateToDashboard: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
      void router.navigate({ to: '/dashboard' });
    },
  },
}).createMachine({
  id: 'createAgent',
  initial: 'naming',
  context: {
    screen: 'naming',
    name: '',
    agent: null,
    privateKey: null,
    registrationUrl: null,
    error: null,
  },

  states: {
    naming: {
      entry: assign({ screen: 'naming' as const, error: null }),
      on: {
        SUBMIT_NAME: {
          target: 'creating',
          actions: assign(({ event }) => ({ name: event.name })),
        },
      },
    },

    creating: {
      entry: assign({ screen: 'creating' as const, error: null }),
      invoke: {
        src: 'createAgentActor',
        input: ({ context }) => ({ name: context.name }),
        onDone: {
          target: 'permissions',
          actions: assign(({ event }) => ({
            agent: event.output.agent,
            privateKey: event.output.ed25519_private_key,
            registrationUrl: event.output.registration_url,
          })),
        },
        onError: {
          target: 'naming',
          actions: assign(({ event }) => ({
            error: {
              message: (event.error as Error).message ?? 'Failed to create agent',
            },
          })),
        },
      },
    },

    permissions: {
      entry: assign({ screen: 'permissions' as const, error: null }),
      on: {
        CONTINUE: 'clawkey',
      },
    },

    clawkey: {
      entry: assign({ screen: 'clawkey' as const, error: null }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            CONFIRM: '#createAgent.done',
            BYPASS_CLAWKEY: 'bypassing',
          },
        },
        bypassing: {
          invoke: {
            src: 'bypassClawKeyActor',
            input: ({ context }) => ({ agentId: context.agent!.id }),
            onDone: {
              target: '#createAgent.done',
              actions: assign(({ event }) => ({
                agent: event.output as Agent,
              })),
            },
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to bypass ClawKey',
                },
              })),
            },
          },
        },
      },
    },

    done: {
      entry: assign({ screen: 'done' as const }),
      after: {
        2000: 'final',
      },
    },

    final: {
      type: 'final',
      entry: 'navigateToDashboard',
    },
  },
});
