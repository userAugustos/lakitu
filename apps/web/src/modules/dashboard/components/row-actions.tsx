import { useMachine } from '@xstate/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { agentActionMachine } from '../agent-action.machine';
import { RestoreIcon, RevokeIcon, RotateIcon } from '../lib/dashboard-icons';
import { ConfirmActionCard } from './confirm-action-card';
import { RotateKeyResult } from './rotate-key-result';

interface RowActionsProps {
  agentId: string;
  agentName: string;
  isRevoked: boolean;
}

export function RowActions({ agentId, agentName, isRevoked }: RowActionsProps) {
  const [state, send] = useMachine(agentActionMachine);
  const prevStateRef = useRef(state.value);

  useEffect(() => {
    if (state.value === 'success' && prevStateRef.current !== 'success') {
      const actionName = state.context.input?.kind === 'restore' ? 'restored' : 'revoked';
      toast.success(`Agent ${actionName} successfully`);
    }
    prevStateRef.current = state.value;
  }, [state.value, state.context.input?.kind]);

  const isIdle = state.matches('idle');
  const isConfirming = state.matches('confirming');
  const isExecuting = state.matches('executing');
  const isError = state.matches('error');
  const isResult = state.matches('result');

  const showCard = isConfirming || isExecuting || isError;

  return (
    <div className="relative inline-flex w-full items-center justify-end gap-1">
      {isRevoked ? (
        <button
          type="button"
          data-testid="restore-agent-btn"
          className="text-dash-ink-2 hover:text-dash-green h7.5 w7.5 relative inline-flex cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#B8E6C8] hover:bg-[#F0FFF4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
          disabled={!isIdle}
          aria-label="Restore agent"
          onClick={() => send({ type: 'START', kind: 'restore', agentId, agentName })}
        >
          <RestoreIcon className="h-3.75 w-3.75" />
        </button>
      ) : (
        <button
          type="button"
          data-testid="revoke-agent-btn"
          className="text-dash-ink-2 hover:text-dash-red h7.5 w7.5 relative inline-flex cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#F3C9C2] hover:bg-[#FFF6F4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
          disabled={!isIdle}
          aria-label="Revoke agent"
          onClick={() => send({ type: 'START', kind: 'revoke', agentId, agentName })}
        >
          <RevokeIcon className="h-3.75 w-3.75" />
        </button>
      )}

      <button
        type="button"
        data-testid="rotate-key-btn"
        className="text-dash-ink-2 hover:text-dash-sky-4 h7.5 w7.5 relative inline-flex cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#BFDDFC] hover:bg-[#F1F8FF] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
        disabled={isRevoked || !isIdle}
        aria-label="Rotate key"
        onClick={() => send({ type: 'START', kind: 'rotate-key', agentId, agentName })}
      >
        <RotateIcon className="h-3.75 w-3.75" />
      </button>

      {showCard && state.context.input && (
        <ConfirmActionCard
          kind={state.context.input.kind}
          agentName={state.context.input.agentName}
          isExecuting={isExecuting}
          error={state.context.error}
          onConfirm={() => send({ type: 'CONFIRM' })}
          onCancel={() => send({ type: 'CANCEL' })}
        />
      )}

      {isResult && state.context.result && (
        <RotateKeyResult
          result={state.context.result}
          onDismiss={() => send({ type: 'DISMISS' })}
        />
      )}
    </div>
  );
}
