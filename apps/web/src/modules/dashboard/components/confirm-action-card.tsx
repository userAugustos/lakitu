import type { AgentActionKind } from '../agent-action.types';

interface ConfirmActionCardProps {
  kind: AgentActionKind;
  agentName: string;
  isExecuting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ACTION_COPY: Record<AgentActionKind, { title: string; description: string }> = {
  revoke: {
    title: 'Revoke Agent',
    description: 'This will immediately disable the agent and invalidate its keys.',
  },
  restore: {
    title: 'Restore Agent',
    description: 'This will re-enable the agent with its existing configuration.',
  },
  'rotate-key': {
    title: 'Rotate Key',
    description: 'This will generate a new keypair. The old key will be invalidated immediately.',
  },
};

export function ConfirmActionCard({
  kind,
  agentName,
  isExecuting,
  error,
  onConfirm,
  onCancel,
}: ConfirmActionCardProps) {
  const copy = ACTION_COPY[kind];
  const isDestructive = kind === 'revoke' || kind === 'rotate-key';

  return (
    <div
      data-testid={`confirm-${kind}-card`}
      className="border-dash-line absolute top-full right-0 z-40 mt-1 w-[260px] rounded-lg border bg-white p-3 shadow-lg"
    >
      <p className="text-dash-ink text-[13px] font-semibold">{copy.title}</p>
      <p className="text-dash-muted mt-0.5 text-[12px]">
        {copy.description} ({agentName})
      </p>

      {error && <p className="text-dash-red mt-2 text-[12px]">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          data-testid={`confirm-${kind}-btn`}
          disabled={isExecuting}
          onClick={onConfirm}
          className={`inline-flex h-[28px] cursor-pointer items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-white disabled:opacity-60 ${
            isDestructive ? 'bg-dash-red hover:bg-dash-red/90' : 'bg-dash-ink hover:bg-dash-ink/90'
          }`}
        >
          {isExecuting && (
            <svg
              className="h-3 w-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          {isExecuting ? 'Processing...' : 'Confirm'}
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={onCancel}
          className="text-dash-ink-2 hover:text-dash-ink h-[28px] cursor-pointer rounded-md px-3 text-[12px] font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
