import { useMachine } from '@xstate/react';
import { Ban, RefreshCw, RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/shadcn/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/shadcn/tooltip';

import { agentActionMachine } from '../agent-action.machine';
import { ConfirmActionContent } from './confirm-action-card';
import { RotateKeyDialog } from './rotate-key-result';
import type { AgentActionKind } from '../agent-action.types';

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
  const isExecuting = state.matches('executing');
  const activeKind = state.context.input?.kind ?? null;
  const showConfirm = state.matches('confirming') || isExecuting || state.matches('error');

  const isPopoverOpen = (kind: AgentActionKind) => showConfirm && activeKind === kind;

  const handleOpenChange = (open: boolean) => {
    if (!open && !isExecuting) {
      send({ type: 'CANCEL' });
    }
  };

  const confirmContent = state.context.input && (
    <ConfirmActionContent
      kind={state.context.input.kind}
      agentName={state.context.input.agentName}
      isExecuting={isExecuting}
      error={state.context.error}
      onConfirm={() => send({ type: 'CONFIRM' })}
      onCancel={() => send({ type: 'CANCEL' })}
    />
  );

  return (
    <div className="relative inline-flex w-full items-center justify-end gap-1">
      {isRevoked ? (
        <Popover open={isPopoverOpen('restore')} onOpenChange={handleOpenChange}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid="restore-agent-btn"
                  className="text-dash-ink-2 hover:text-dash-green relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#B8E6C8] hover:bg-[#F0FFF4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
                  disabled={!isIdle}
                  aria-label="Restore agent"
                  onClick={() => send({ type: 'START', kind: 'restore', agentId, agentName })}
                >
                  <RotateCcw className="h-[15px] w-[15px]" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Restore agent</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-[260px]">
            {confirmContent}
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={isPopoverOpen('revoke')} onOpenChange={handleOpenChange}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid="revoke-agent-btn"
                  className="text-dash-ink-2 hover:text-dash-red relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#F3C9C2] hover:bg-[#FFF6F4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
                  disabled={!isIdle}
                  aria-label="Revoke agent"
                  onClick={() => send({ type: 'START', kind: 'revoke', agentId, agentName })}
                >
                  <Ban className="h-[15px] w-[15px]" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Revoke agent</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-[260px]">
            {confirmContent}
          </PopoverContent>
        </Popover>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <RotateKeyDialog agentId={agentId} agentName={agentName}>
            <button
              type="button"
              data-testid="rotate-key-btn"
              className="text-dash-ink-2 hover:text-dash-sky-4 relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#BFDDFC] hover:bg-[#F1F8FF] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
              disabled={isRevoked}
              aria-label="Rotate key"
            >
              <RefreshCw className="h-[15px] w-[15px]" />
            </button>
          </RotateKeyDialog>
        </TooltipTrigger>
        <TooltipContent>Rotate key</TooltipContent>
      </Tooltip>
    </div>
  );
}
