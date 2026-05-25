import { useMachine } from '@xstate/react';

import { Button } from '@repo/ui/shadcn/button';
import { cn } from '@repo/ui/utils';

import { auditLogVerifyMachine } from '../audit-log-verify.machine';

export function VerifyChainButton() {
  const [state, send] = useMachine(auditLogVerifyMachine);
  const isVerifying = state.matches('verifying');

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="verify-chain-button"
        disabled={isVerifying}
        onClick={() => send({ type: 'VERIFY' })}
      >
        {isVerifying ? 'Verifying...' : 'Verify Chain'}
      </Button>

      {(state.matches('valid') || state.matches('broken')) && state.context.result && (
        <span
          data-testid="verify-chain-result-pill"
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            state.matches('valid')
              ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
              : 'border-red-200 bg-red-100 text-red-800'
          )}
        >
          {state.matches('valid')
            ? `Chain verified · ${state.context.result.chain_length} entries`
            : `Chain broken: ${!state.context.result.valid ? state.context.result.broken_at.reason : ''}`}
        </span>
      )}

      {state.context.error && (
        <span className="text-destructive text-sm">{state.context.error.message}</span>
      )}
    </div>
  );
}
