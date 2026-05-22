import { Ban, RefreshCw, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { Agent, RotateKeyResponse } from '@lakitu/api/agents';

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/shadcn/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/shadcn/tooltip';
import { apiCall, lakituAuthApi } from '@/api';
import { queryClient, router } from '@/main';

import { ConfirmActionContent } from './confirm-action-card';

interface RowActionsProps {
  agentId: string;
  agentName: string;
  isRevoked: boolean;
}

export function RowActions({ agentId, agentName, isRevoked }: RowActionsProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (kind: string) => {
    setIsExecuting(true);
    setError(null);
    try {
      switch (kind) {
        case 'revoke':
          await apiCall<Agent>(() => lakituAuthApi.agents[agentId]!.revoke.patch());
          break;
        case 'restore':
          await apiCall<Agent>(() => lakituAuthApi.agents[agentId]!.restore.patch());
          break;
        case 'rotate-key': {
          const result = await apiCall<RotateKeyResponse>(() =>
            lakituAuthApi.agents[agentId]!['rotate-key'].post()
          );
          setOpenPopover(null);
          setIsExecuting(false);
          void queryClient.invalidateQueries({ queryKey: ['agents'] });
          void router.navigate({
            to: '/dashboard/rotate-key-result' as string,
            state: result as unknown as Record<string, unknown>,
          });
          return;
        }
      }
      setOpenPopover(null);
      setIsExecuting(false);
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
      const label = kind === 'restore' ? 'restored' : 'revoked';
      toast.success(`Agent ${label} successfully`);
    } catch (e) {
      setError((e as Error).message ?? 'Action failed');
      setIsExecuting(false);
    }
  };

  const handleCancel = () => {
    if (isExecuting) return;
    setOpenPopover(null);
    setError(null);
  };

  return (
    <div className="relative inline-flex w-full items-center justify-end gap-1">
      {isRevoked ? (
        <Popover
          open={openPopover === 'restore'}
          onOpenChange={(open) => (open ? setOpenPopover('restore') : handleCancel())}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid="restore-agent-btn"
                  className="text-dash-ink-2 hover:text-dash-green relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#B8E6C8] hover:bg-[#F0FFF4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
                  disabled={isExecuting}
                  aria-label="Restore agent"
                >
                  <RotateCcw className="h-[15px] w-[15px]" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Restore agent</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-[260px]">
            <ConfirmActionContent
              kind="restore"
              agentName={agentName}
              isExecuting={isExecuting}
              error={error}
              onConfirm={() => handleConfirm('restore')}
              onCancel={handleCancel}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Popover
          open={openPopover === 'revoke'}
          onOpenChange={(open) => (open ? setOpenPopover('revoke') : handleCancel())}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid="revoke-agent-btn"
                  className="text-dash-ink-2 hover:text-dash-red relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#F3C9C2] hover:bg-[#FFF6F4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
                  disabled={isExecuting}
                  aria-label="Revoke agent"
                >
                  <Ban className="h-[15px] w-[15px]" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Revoke agent</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-[260px]">
            <ConfirmActionContent
              kind="revoke"
              agentName={agentName}
              isExecuting={isExecuting}
              error={error}
              onConfirm={() => handleConfirm('revoke')}
              onCancel={handleCancel}
            />
          </PopoverContent>
        </Popover>
      )}

      <Popover
        open={openPopover === 'rotate-key'}
        onOpenChange={(open) => (open ? setOpenPopover('rotate-key') : handleCancel())}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-testid="rotate-key-btn"
                className="text-dash-ink-2 hover:text-dash-sky-4 relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#BFDDFC] hover:bg-[#F1F8FF] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
                disabled={isRevoked || isExecuting}
                aria-label="Rotate key"
              >
                <RefreshCw className="h-[15px] w-[15px]" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Rotate key</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-[260px]">
          <ConfirmActionContent
            kind="rotate-key"
            agentName={agentName}
            isExecuting={isExecuting}
            error={error}
            onConfirm={() => handleConfirm('rotate-key')}
            onCancel={handleCancel}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
