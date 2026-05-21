import { assign, fromPromise, setup } from 'xstate';

import type { ChallengeResponse, User, VerifyResponse } from '@lakitu/api/auth';
import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { apiCall, lakituAuthApi, lakituPublicApi } from '@/api';
import { router } from '@/main';
import { authActions } from '@/modules/auth/auth.store';

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
    resolvePosition: fromPromise(
      async (): Promise<ResolvePositionResult | 'very_ai_callback' | null> => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code && state) return 'very_ai_callback';

        const token = authActions.getToken();
        if (!token || isTokenExpired(token)) return null;

        const user = await apiCall<User>(() => lakituAuthApi.auth.profile.get());
        const onboardingStatus = await apiCall<OnboardingStatus>(() =>
          lakituAuthApi.onboarding.status.get()
        );
        return { token, user, onboardingStatus };
      }
    ),

    sendChallenge: fromPromise(async ({ input }: { input: { email: string } }) => {
      const result = await apiCall<ChallengeResponse>(() =>
        lakituPublicApi.auth.challenge.post({ email: input.email })
      );
      return { challengeId: result.challenge_id };
    }),

    verifyOtp: fromPromise(async ({ input }: { input: { email: string; code: string } }) => {
      const result = await apiCall<VerifyResponse>(() =>
        lakituPublicApi.auth.verify.post({ email: input.email, code: input.code })
      );
      return { token: result.token, user: result.user };
    }),

    checkOnboardingStatus: fromPromise(async () => {
      return apiCall<OnboardingStatus>(() => lakituAuthApi.onboarding.status.get());
    }),

    createCompanyActor: fromPromise(async ({ input }: { input: { name: string } }) => {
      await apiCall(() => lakituAuthApi.companies.post({ name: input.name }));
    }),

    joinCompanyActor: fromPromise(async ({ input }: { input: { companyId: string } }) => {
      await apiCall(() => lakituAuthApi.companies[input.companyId]!.join.post());
    }),

    startVeryAiLinkActor: fromPromise(async () => {
      const result = await apiCall<{ authorize_url: string }>(() =>
        lakituAuthApi.onboarding['very-ai'].start.post()
      );
      return { authorizeUrl: result.authorize_url };
    }),

    completeVeryAiLinkActor: fromPromise(async () => {
      const params = new URLSearchParams(window.location.search);
      await apiCall(() =>
        lakituPublicApi.onboarding['very-ai'].callback.get({
          $query: { code: params.get('code')!, state: params.get('state')! },
        })
      );
      window.history.replaceState({}, '', window.location.pathname);
      const onboardingStatus = await apiCall<OnboardingStatus>(() =>
        lakituAuthApi.onboarding.status.get()
      );
      return { onboardingStatus };
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
            guard: ({ event }) => event.output === 'very_ai_callback',
            target: 'veryAiCallback',
          },
          {
            guard: ({ event }) => {
              const out = event.output as ResolvePositionResult | null;
              return out !== null && out.onboardingStatus.onboarded;
            },
            target: 'success',
            actions: assign(({ event }) => {
              const out = event.output as ResolvePositionResult;
              return {
                token: out.token,
                user: out.user,
                onboardingStatus: out.onboardingStatus,
                screen: 'success' as const,
              };
            }),
          },
          {
            guard: ({ event }) => {
              const out = event.output as ResolvePositionResult | null;
              return out !== null && out.onboardingStatus.next_step === 'company';
            },
            target: 'company',
            actions: assign(({ event }) => {
              const out = event.output as ResolvePositionResult;
              return {
                token: out.token,
                user: out.user,
                onboardingStatus: out.onboardingStatus,
                screen: 'company' as const,
              };
            }),
          },
          {
            guard: ({ event }) => {
              const out = event.output as ResolvePositionResult | null;
              if (!out) return false;
              const step = out.onboardingStatus.next_step;
              return (
                step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
              );
            },
            target: 'veryAi',
            actions: assign(({ event }) => {
              const out = event.output as ResolvePositionResult;
              return {
                token: out.token,
                user: out.user,
                onboardingStatus: out.onboardingStatus,
                screen: 'very-ai' as const,
              };
            }),
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

    veryAiCallback: {
      entry: assign({ screen: 'very-ai' as const }),
      invoke: {
        src: 'completeVeryAiLinkActor',
        onDone: [
          {
            guard: ({ event }) => event.output.onboardingStatus.onboarded === true,
            target: 'success',
            actions: assign(({ event }) => ({
              onboardingStatus: event.output.onboardingStatus,
            })),
          },
          {
            target: 'error',
            actions: assign(({ event }) => ({
              onboardingStatus: event.output.onboardingStatus,
              error: { message: 'Onboarding not yet complete after VeryAI verification' },
            })),
          },
        ],
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: {
              message: (event.error as Error).message ?? 'VeryAI verification failed',
            },
          })),
        },
      },
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
