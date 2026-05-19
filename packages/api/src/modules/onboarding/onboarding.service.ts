import type { OnboardingStatus } from './types';

async function computeStatus(): Promise<OnboardingStatus> {
  return {
    onboarded: false,
    next_step: 'company',
    conditions: {
      company: { satisfied: false },
      very_ai_linked: { satisfied: false },
      very_ai_verified: { satisfied: false },
    },
  };
}

export const onboardingService = { computeStatus };
