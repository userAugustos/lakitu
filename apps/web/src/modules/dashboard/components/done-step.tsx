import { CheckIcon } from '../lib/dashboard-icons';

interface DoneStepProps {
  agentName: string;
}

export function DoneStep({ agentName }: DoneStepProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8" data-testid="agent-done">
      <div className="bg-dash-green inline-flex h-12 w-12 items-center justify-center rounded-full text-white">
        <CheckIcon className="h-6 w-6" />
      </div>
      <div className="text-center">
        <h3 className="text-dash-ink text-[18px] font-semibold">Agent {agentName} is live</h3>
        <p className="text-dash-muted mt-1 text-[13px]">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
