import { authRepository } from '@api/modules/auth/auth.repository';
import { unauthorized } from '@core/errors';

import type { OnboardingNextStep, OnboardingStatus } from './types';

async function computeStatus(userId: string): Promise<OnboardingStatus> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');

  const companySatisfied = user.companyId !== null;
  const veryAiLinked = user.veryAiStatus !== 'unlinked';
  const veryAiVerified = user.veryAiStatus === 'verified';

  let nextStep: OnboardingNextStep;
  if (!companySatisfied) nextStep = 'company';
  else if (!veryAiLinked) nextStep = 'very_ai_link';
  else if (!veryAiVerified) nextStep = 'very_ai_verify';
  else nextStep = null;

  const onboarded = companySatisfied && veryAiLinked && veryAiVerified;

  return {
    onboarded,
    next_step: nextStep,
    conditions: {
      company: { satisfied: companySatisfied },
      very_ai_linked: { satisfied: veryAiLinked },
      very_ai_verified: { satisfied: veryAiVerified },
    },
  };
}

export const onboardingService = { computeStatus };
