import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';
import { FieldError } from '@/modules/auth/components/field-error';
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
    formState: { errors },
    setError,
    reset,
  } = useForm<SimulateFormValues>({
    resolver: zodResolver(simulateFormSchema),
    defaultValues: { agent_id: '', action: '', context: '' },
  });

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        data-testid="simulate-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Trigger Action"
        className="relative z-10 w-full max-w-[480px] rounded-2xl border border-[#EAEDF2] bg-white p-6 shadow-xl"
      >
        <h2 className="text-dash-ink mb-1 text-[18px] font-semibold">Trigger Action</h2>
        <p className="text-dash-muted mb-5 text-[13px]">
          Simulate a pending action for testing purposes.
        </p>

        <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-agent" className="text-xs font-semibold tracking-wide">
              Agent
            </Label>
            <select
              id="sim-agent"
              data-testid="simulate-agent-select"
              className="border-input text-dash-ink h-11 w-full appearance-none rounded-xl border bg-white px-4 text-sm outline-none"
              {...register('agent_id')}
            >
              <option value="">Select an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.agent_id?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-action" className="text-xs font-semibold tracking-wide">
              Action
            </Label>
            <Input
              id="sim-action"
              type="text"
              placeholder="e.g. transfer_funds"
              data-testid="simulate-action-input"
              className={errors.action ? 'border-destructive' : ''}
              {...register('action')}
            />
            <FieldError message={errors.action?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-context" className="text-xs font-semibold tracking-wide">
              Context{' '}
              <span className="text-dash-muted font-normal tracking-normal normal-case">
                (optional JSON)
              </span>
            </Label>
            <textarea
              id="sim-context"
              data-testid="simulate-context-input"
              placeholder='e.g. { "amount": 500, "currency": "USD" }'
              className="border-input placeholder:text-dash-muted text-dash-ink min-h-[72px] w-full resize-y rounded-md border bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[var(--dash-ink)] focus:shadow-[0_0_0_4px_rgba(11,27,51,0.08)]"
              {...register('context')}
            />
            <FieldError message={errors.context?.message} />
          </div>

          {error && <p className="text-destructive text-[13px]">{error}</p>}

          <div className="mt-2 flex gap-3">
            <Button
              type="submit"
              data-testid="simulate-submit-btn"
              disabled={isLoading}
              className="w-auto px-5"
              size="sm"
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-auto px-5"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
