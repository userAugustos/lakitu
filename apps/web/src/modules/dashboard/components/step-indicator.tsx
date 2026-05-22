import { CheckIcon } from '../lib/dashboard-icons';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`h-px w-10 ${isCompleted || isCurrent ? 'bg-dash-ink' : 'bg-dash-line-2'}`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
                  isCompleted
                    ? 'bg-dash-green text-white'
                    : isCurrent
                      ? 'bg-dash-ink text-white'
                      : 'border-dash-line-2 text-dash-muted border-2'
                }`}
              >
                {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isFuture ? 'text-dash-muted' : 'text-dash-ink'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
