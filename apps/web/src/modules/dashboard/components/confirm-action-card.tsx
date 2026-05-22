import { Loader2 } from 'lucide-react';

import { cn } from '@repo/ui/utils';

import type { AgentActionKind } from '../agent-action.types';

interface ConfirmActionContentProps {
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
};

export function ConfirmActionContent({
  kind,
  agentName,
  isExecuting,
  error,
  onConfirm,
  onCancel,
}: ConfirmActionContentProps) {
  const copy = ACTION_COPY[kind];
  const isDestructive = kind === 'revoke';

  return (
    <div data-testid={`confirm-${kind}-card`}>
      <p className="text-dash-ink text-[13px] font-semibold">{copy.title}</p>
      <p className="text-dash-muted mt-0.5 text-[12px]">
        {copy.description} ({agentName})
      </p>

      <p className={cn('text-dash-red mt-2 text-[12px]', !error && 'hidden')}>{error}</p>

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
          {isExecuting && <Loader2 className="h-3 w-3 animate-spin" />}
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
