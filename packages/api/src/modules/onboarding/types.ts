import { t } from 'elysia';

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

const OnboardingConditionSchema = t.Object({
  satisfied: t.Boolean(),
});

export const OnboardingStatusSchema = t.Object({
  onboarded: t.Boolean(),
  next_step: t.Union([
    t.Literal('company'),
    t.Literal('very_ai_link'),
    t.Literal('very_ai_verify'),
    t.Literal('very_ai_reverify'),
    t.Null(),
  ]),
  conditions: t.Object({
    company: OnboardingConditionSchema,
    very_ai_linked: OnboardingConditionSchema,
    very_ai_verified: OnboardingConditionSchema,
  }),
});
