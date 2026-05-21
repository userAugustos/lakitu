import { assign, fromPromise, setup } from 'xstate';

import type { User } from '@lakitu/api/auth';
import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { router } from '@/main';
import { authActions } from '@/modules/auth/auth.store';

import {
  createCompany,
  fetchOnboardingStatus,
  fetchProfile,
  joinCompany,
  sendChallenge,
  startVeryAiLink,
  verifyOtp,
} from './auth-setup.api';
import { isTokenExpired } from './lib/jwt-decode';
import type { AuthSetupContext, AuthSetupEvent } from './auth-setup.types';

interface ResolvePositionResult {
  token: string;
  user: User;
  onboardingStatus: OnboardingStatus;
}

export const authSetupMachine = setup({
  types: {} as {
    context: AuthSetupContext;
    events: AuthSetupEvent;
  },
  actors: {
    resolvePosition: fromPromise(async (): Promise<ResolvePositionResult | null> => {
      const token = authActions.getToken();
      if (!token || isTokenExpired(token)) return null;

      authActions.hydrate();
      const user = await fetchProfile();
      const onboardingStatus = await fetchOnboardingStatus();
      return { token, user, onboardingStatus };
    }),

    sendChallenge: fromPromise(async ({ input }: { input: { email: string } }) => {
      const result = await sendChallenge(input.email);
      return { challengeId: result.challenge_id };
    }),

    verifyOtp: fromPromise(async ({ input }: { input: { email: string; code: string } }) => {
      const result = await verifyOtp(input.email, input.code);
      return { token: result.token, user: result.user };
    }),

    checkOnboardingStatus: fromPromise(async () => {
      return fetchOnboardingStatus();
    }),

    createCompanyActor: fromPromise(async ({ input }: { input: { name: string } }) => {
      await createCompany(input.name);
    }),

    joinCompanyActor: fromPromise(async ({ input }: { input: { companyId: string } }) => {
      await joinCompany(input.companyId);
    }),

    startVeryAiLinkActor: fromPromise(async () => {
      const result = await startVeryAiLink();
      return { authorizeUrl: result.authorize_url };
    }),
  },
  guards: {
    canRetry: ({ context }) => context.retryCount < 3,
  },
  actions: {
    writeToAuthStore: ({ context }) => {
      if (context.user && context.token) {
        authActions.login(context.user, context.token);
      }
    },
    navigateToDashboard: () => {
      const returnUrl = authActions.getReturnUrl();
      authActions.setReturnUrl(null);
      void router.navigate({ to: returnUrl ?? '/dashboard' });
    },
    clearAuth: () => {
      authActions.logout();
    },
  },
}).createMachine({
  id: 'authSetup',
  initial: 'verification',
  context: {
    screen: 'loading',
    email: '',
    challengeId: null,
    token: null,
    user: null,
    onboardingStatus: null,
    error: null,
    retryCount: 0,
  },

  on: {
    LOGOUT: {
      target: '.email',
      actions: [
        'clearAuth',
        assign({
          screen: 'email' as const,
          token: null,
          user: null,
          onboardingStatus: null,
          email: '',
          challengeId: null,
          error: null,
        }),
      ],
    },
  },

  states: {
    verification: {
      entry: assign({ screen: 'loading' as const }),
      invoke: {
        src: 'resolvePosition',
        onDone: [
          {
            guard: ({ event }) => event.output !== null && event.output.onboardingStatus.onboarded,
            target: 'success',
            actions: assign(({ event }) => ({
              token: event.output!.token,
              user: event.output!.user,
              onboardingStatus: event.output!.onboardingStatus,
              screen: 'success' as const,
            })),
          },
          {
            guard: ({ event }) =>
              event.output !== null && event.output.onboardingStatus.next_step === 'company',
            target: 'company',
            actions: assign(({ event }) => ({
              token: event.output!.token,
              user: event.output!.user,
              onboardingStatus: event.output!.onboardingStatus,
              screen: 'company' as const,
            })),
          },
          {
            guard: ({ event }) => {
              if (!event.output) return false;
              const step = event.output.onboardingStatus.next_step;
              return (
                step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
              );
            },
            target: 'veryAi',
            actions: assign(({ event }) => ({
              token: event.output!.token,
              user: event.output!.user,
              onboardingStatus: event.output!.onboardingStatus,
              screen: 'very-ai' as const,
            })),
          },
          {
            target: 'email',
            actions: assign({ screen: 'email' as const }),
          },
        ],
        onError: {
          target: 'email',
          actions: assign({ screen: 'email' as const }),
        },
      },
    },

    email: {
      entry: assign({ screen: 'email' as const }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            SUBMIT_EMAIL: {
              target: 'submitting',
              actions: assign(({ event }) => ({ email: event.email })),
            },
          },
        },
        submitting: {
          invoke: {
            src: 'sendChallenge',
            input: ({ context }) => ({ email: context.email }),
            onDone: {
              target: 'done',
              actions: assign(({ event }) => ({
                challengeId: event.output.challengeId,
              })),
            },
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to send code',
                },
              })),
            },
          },
        },
        done: { type: 'final' as const },
      },
      onDone: { target: 'otp' },
    },

    otp: {
      entry: assign({ screen: 'otp' as const, error: null }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            SUBMIT_OTP: 'submitting',
            BACK_TO_EMAIL: {
              target: '#authSetup.email',
              actions: assign({ challengeId: null, error: null }),
            },
          },
        },
        submitting: {
          entry: assign({ error: null }),
          invoke: {
            src: 'verifyOtp',
            input: ({ context, event }) => ({
              email: context.email,
              code: (event as { type: 'SUBMIT_OTP'; code: string }).code,
            }),
            onDone: {
              target: 'checkingStatus',
              actions: assign(({ event }) => ({
                token: event.output.token,
                user: event.output.user,
              })),
            },
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Invalid code',
                },
              })),
            },
          },
        },
        checkingStatus: {
          entry: ({ context }) => {
            if (context.token) {
              authActions.login(context.user!, context.token);
            }
          },
          invoke: {
            src: 'checkOnboardingStatus',
            onDone: {
              target: 'done',
              actions: assign(({ event }) => ({
                onboardingStatus: event.output,
              })),
            },
            onError: {
              target: '#authSetup.error',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to check onboarding status',
                },
              })),
            },
          },
        },
        done: { type: 'final' as const },
      },
      onDone: [
        {
          guard: ({ context }) => context.onboardingStatus?.onboarded === true,
          target: 'success',
        },
        {
          guard: ({ context }) => context.onboardingStatus?.next_step === 'company',
          target: 'company',
        },
        {
          guard: ({ context }) => {
            const step = context.onboardingStatus?.next_step;
            return (
              step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
            );
          },
          target: 'veryAi',
        },
        { target: 'success' },
      ],
    },

    company: {
      entry: assign({ screen: 'company' as const, error: null }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            CREATE_COMPANY: 'creating',
            JOIN_COMPANY: 'joining',
          },
        },
        creating: {
          invoke: {
            src: 'createCompanyActor',
            input: ({ event }) => ({
              name: (event as { type: 'CREATE_COMPANY'; name: string }).name,
            }),
            onDone: 'checkingStatus',
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to create company',
                },
              })),
            },
          },
        },
        joining: {
          invoke: {
            src: 'joinCompanyActor',
            input: ({ event }) => ({
              companyId: (event as { type: 'JOIN_COMPANY'; companyId: string }).companyId,
            }),
            onDone: 'checkingStatus',
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to join company',
                },
              })),
            },
          },
        },
        checkingStatus: {
          invoke: {
            src: 'checkOnboardingStatus',
            onDone: {
              target: 'done',
              actions: assign(({ event }) => ({
                onboardingStatus: event.output,
              })),
            },
            onError: {
              target: '#authSetup.error',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to check status',
                },
              })),
            },
          },
        },
        done: { type: 'final' as const },
      },
      onDone: [
        {
          guard: ({ context }) => {
            const step = context.onboardingStatus?.next_step;
            return (
              step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
            );
          },
          target: 'veryAi',
        },
        { target: 'success' },
      ],
    },

    veryAi: {
      entry: assign({ screen: 'very-ai' as const, error: null }),
      invoke: {
        src: 'startVeryAiLinkActor',
        onDone: {
          actions: ({ event }) => {
            window.location.href = event.output.authorizeUrl;
          },
        },
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: {
              message: (event.error as Error).message ?? 'Failed to start VeryAI link',
            },
          })),
        },
      },
    },

    success: {
      entry: assign({ screen: 'success' as const }),
      after: {
        1500: 'authenticated',
      },
    },

    authenticated: {
      type: 'final',
      entry: ['writeToAuthStore', 'navigateToDashboard'],
    },

    error: {
      entry: assign(({ context }) => ({
        screen: 'error' as const,
        retryCount: context.retryCount + 1,
      })),
      on: {
        RETRY: {
          guard: 'canRetry',
          target: 'verification',
          actions: assign({ error: null }),
        },
      },
    },
  },
});
