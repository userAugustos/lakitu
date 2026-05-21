interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="step-pill" data-testid="step-indicator">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const cls = isCurrent ? 'step on' : isDone ? 'step done' : 'step';

        return (
          <span key={stepNum}>
            {i > 0 && <span className="step-line" />}
            <span className={cls}>
              {isDone ? (
                <svg width="10" height="10" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3 8.5l3.5 3.5 6.5-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                stepNum
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
