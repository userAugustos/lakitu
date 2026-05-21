import type { OnboardingNextStep } from '@lakitu/api/onboarding';

export type OnboardingStepRoute = 'company' | 'very-ai';

const STEP_ROUTE_MAP: Record<NonNullable<OnboardingNextStep>, OnboardingStepRoute> = {
  company: 'company',
  very_ai_link: 'very-ai',
  very_ai_verify: 'very-ai',
  very_ai_reverify: 'very-ai',
};

export function mapNextStepToRoute(nextStep: NonNullable<OnboardingNextStep>): OnboardingStepRoute {
  return STEP_ROUTE_MAP[nextStep];
}
