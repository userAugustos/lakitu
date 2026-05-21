import { z } from 'zod';

export type OnboardingNextStep =
  | 'company'
  | 'very_ai_link'
  | 'very_ai_verify'
  | 'very_ai_reverify'
  | null;

export interface OnboardingCondition {
  satisfied: boolean;
}

export interface OnboardingStatus {
  onboarded: boolean;
  next_step: OnboardingNextStep;
  conditions: {
    company: OnboardingCondition;
    very_ai_linked: OnboardingCondition;
    very_ai_verified: OnboardingCondition;
  };
}

const OnboardingConditionSchema = z.object({
  satisfied: z.boolean(),
});

export const OnboardingStatusSchema = z.object({
  onboarded: z.boolean(),
  next_step: z.enum(['company', 'very_ai_link', 'very_ai_verify', 'very_ai_reverify']).nullable(),
  conditions: z.object({
    company: OnboardingConditionSchema,
    very_ai_linked: OnboardingConditionSchema,
    very_ai_verified: OnboardingConditionSchema,
  }),
});
