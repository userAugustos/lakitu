import { assign, fromPromise, setup } from 'xstate';

import type { VerifyChainResponse } from '@lakitu/api/audit-log';

import { apiCall, lakituAuthApi } from '@/api';

interface AuditLogVerifyContext {
  result: VerifyChainResponse | null;
  error: { message: string } | null;
}

type AuditLogVerifyEvent = { type: 'VERIFY' } | { type: 'RETRY' };

export const auditLogVerifyMachine = setup({
  types: {} as {
    context: AuditLogVerifyContext;
    events: AuditLogVerifyEvent;
  },
  actors: {
    verifyActor: fromPromise(async () => {
      return apiCall<VerifyChainResponse>(() => lakituAuthApi['audit-logs'].verify.get());
    }),
  },
}).createMachine({
  id: 'auditLogVerify',
  initial: 'idle',
  context: {
    result: null,
    error: null,
  },

  states: {
    idle: {
      on: {
        VERIFY: 'verifying',
      },
    },

    verifying: {
      invoke: {
        src: 'verifyActor',
        onDone: [
          {
            guard: ({ event }) => event.output.valid,
            target: 'valid',
            actions: assign(({ event }) => ({ result: event.output, error: null })),
          },
          {
            target: 'broken',
            actions: assign(({ event }) => ({ result: event.output, error: null })),
          },
        ],
        onError: {
          target: 'idle',
          actions: assign(({ event }) => ({
            error: { message: (event.error as Error).message ?? 'Verification failed' },
          })),
        },
      },
    },

    valid: {
      on: {
        RETRY: 'verifying',
        VERIFY: 'verifying',
      },
    },

    broken: {
      on: {
        RETRY: 'verifying',
        VERIFY: 'verifying',
      },
    },
  },
});
