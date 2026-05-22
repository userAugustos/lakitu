import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@repo/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/shadcn/dialog';
import { Label } from '@repo/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/shadcn/select';
import { Textarea } from '@repo/ui/shadcn/textarea';
import { FieldError } from '@/modules/auth/components/field-error';
import { formatAgentActionLabel } from '@/modules/core/lib/agent-actions';
import { agentsQueryOptions } from '@/modules/dashboard/lib/agents-query';

import { simulateFormSchema } from '../approvals.schemas';
import type { SimulateFormValues } from '../approvals.schemas';

interface SimulateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { agent_id: string; action: string; context?: Record<string, unknown> }) => void;
  isLoading: boolean;
  error: string | null;
}

export function SimulateDialog({ open, onClose, onSubmit, isLoading, error }: SimulateDialogProps) {
  const { data: agentsData } = useQuery(agentsQueryOptions);
  const agents = agentsData?.agents ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    setValue,
    watch,
    reset,
  } = useForm<SimulateFormValues>({
    resolver: zodResolver(simulateFormSchema),
    defaultValues: { agent_id: '', action: '', context: '' },
  });

  const selectedAgentId = watch('agent_id');
  const selectedAction = watch('action');
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId),
    [agents, selectedAgentId]
  );
  const availablePermissions = selectedAgent?.permissions ?? [];
  const selectedPermission = availablePermissions.find(
    (permission) => permission.action === selectedAction
  );

  const onValid = (data: SimulateFormValues) => {
    let parsedContext: Record<string, unknown> | undefined;
    const raw = data.context?.trim();
    if (raw) {
      try {
        parsedContext = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        setError('context', { message: 'Invalid JSON' });
        return;
      }
    }
    onSubmit({ agent_id: data.agent_id, action: data.action, context: parsedContext });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent data-testid="simulate-dialog">
        <DialogHeader>
          <DialogTitle>Trigger Action</DialogTitle>
          <DialogDescription>Simulate a pending action for testing purposes.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-agent">Agent</Label>
            <Controller
              control={control}
              name="agent_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('action', '');
                  }}
                >
                  <SelectTrigger data-testid="simulate-agent-select" id="sim-agent">
                    <SelectValue placeholder="Select an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.agent_id?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-action">Action</Label>
            <Controller
              control={control}
              name="action"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedAgent || availablePermissions.length === 0}
                >
                  <SelectTrigger
                    data-testid="simulate-action-select"
                    id="sim-action"
                    className={errors.action ? 'border-destructive' : ''}
                  >
                    <SelectValue
                      placeholder={
                        selectedAgent ? 'Select a granted action...' : 'Select an agent first...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePermissions.map((permission) => (
                      <SelectItem key={permission.action} value={permission.action}>
                        {formatAgentActionLabel(permission.action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedPermission?.policy_limits && (
              <p className="text-muted-foreground font-mono text-[11px]">
                Policy: {JSON.stringify(selectedPermission.policy_limits)}
              </p>
            )}
            <FieldError message={errors.action?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-context">
              Context <span className="text-muted-foreground font-normal">(optional JSON)</span>
            </Label>
            <Textarea
              id="sim-context"
              data-testid="simulate-context-input"
              placeholder='e.g. { "amount": 500, "currency": "USD" }'
              className="font-mono text-[13px]"
              {...register('context')}
            />
            <FieldError message={errors.context?.message} />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" data-testid="simulate-submit-btn" disabled={isLoading} size="sm">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
