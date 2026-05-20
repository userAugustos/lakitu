import { createFileRoute } from '@tanstack/react-router';

const VALID_STEPS = ['company', 'very-ai'] as const;

type OnboardingStep = (typeof VALID_STEPS)[number];

export const Route = createFileRoute('/onboarding/$step')({
  params: {
    parse: ({ step }) => {
      if (!VALID_STEPS.includes(step as OnboardingStep)) {
        throw new Error(`Invalid onboarding step: ${step}`);
      }
      return { step: step as OnboardingStep };
    },
    stringify: ({ step }) => ({ step }),
  },
  component: OnboardingStepPage,
});

function OnboardingStepPage() {
  const { step } = Route.useParams();

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div data-testid="onboarding-step-page" className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-muted-foreground text-sm">
          Current step: <span data-testid="onboarding-step-name">{step}</span>
        </p>
      </div>
    </main>
  );
}
