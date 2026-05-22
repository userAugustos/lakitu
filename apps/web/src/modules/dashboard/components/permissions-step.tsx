import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { AgentPermission } from '@lakitu/api/permissions';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';
import { FieldError } from '@/modules/auth/components/field-error';

import { permissionFormSchema } from '../create-agent.schemas';
import { CheckIcon } from '../lib/dashboard-icons';
import type { PermissionFormValues } from '../create-agent.schemas';

interface PermissionsStepProps {
  agentName: string;
  grantedPermissions: AgentPermission[];
  onAddPermission: (action: string, policyLimits: Record<string, unknown> | null) => void;
  onContinue: () => void;
  isGranting: boolean;
  error: string | null;
}

function formatActionValue(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_:]/g, '');
}

function parsePolicyLimits(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function PermissionsStep({
  agentName,
  grantedPermissions,
  onAddPermission,
  onContinue,
  isGranting,
  error,
}: PermissionsStepProps) {
  const [dirty, setDirty] = useState(false);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
    setValue,
    watch,
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    mode: 'onSubmit',
    defaultValues: { action: '', policyLimits: '' },
  });

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  const onValid = (data: PermissionFormValues) => {
    setDirty(false);
    setLimitsError(null);

    const rawLimits = data.policyLimits?.trim() ?? '';
    if (rawLimits) {
      try {
        JSON.parse(rawLimits);
      } catch {
        setLimitsError('Invalid JSON');
        return;
      }
    }

    onAddPermission(data.action, parsePolicyLimits(rawLimits));
    reset();
  };

  const actionValue = watch('action');
  const { onChange: _actionOnChange, ...actionRest } = register('action');
  const visibleError = dirty ? null : (errors.action?.message ?? error);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-dash-ink text-[16px] font-semibold">Permissions for {agentName}</h3>
        <p className="text-dash-muted mt-1 text-[13px]">
          Grant permissions to define what this agent can do. You can skip this and add them later.
        </p>
      </div>

      <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permission-action" className="text-xs font-semibold tracking-wide">
            Action
          </Label>
          <Input
            id="permission-action"
            type="text"
            placeholder="e.g. read:telemetry"
            data-testid="permission-action-input"
            className={
              visibleError ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]' : ''
            }
            onChange={(e) => {
              const formatted = formatActionValue(e.target.value);
              setValue('action', formatted, { shouldValidate: dirty });
              setDirty(true);
              clearErrors('action');
            }}
            value={actionValue}
            ref={actionRest.ref}
            name={actionRest.name}
            onBlur={actionRest.onBlur}
          />
          <p className="text-dash-muted text-[11px]">
            Lowercase, colons for namespacing. Spaces become underscores.
          </p>
          <FieldError message={visibleError} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="policy-limits" className="text-xs font-semibold tracking-wide">
            Policy limits{' '}
            <span className="text-dash-muted font-normal tracking-normal normal-case">
              (optional)
            </span>
          </Label>
          <textarea
            id="policy-limits"
            data-testid="policy-limits-input"
            placeholder='e.g. { "max_calls": 100, "rate_limit": "10/min" }'
            className="border-input placeholder:text-dash-muted text-dash-ink min-h-[72px] w-full resize-y rounded-md border bg-white px-3 py-2 font-mono text-[13px] transition-colors outline-none focus:border-[var(--dash-ink)] focus:shadow-[0_0_0_4px_rgba(11,27,51,0.08)]"
            {...register('policyLimits')}
          />
          <FieldError message={limitsError} />
        </div>

        <Button
          type="submit"
          disabled={isGranting}
          variant="outline"
          data-testid="add-permission-submit"
          className="self-start"
        >
          {isGranting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add permission
            </>
          )}
        </Button>
      </form>

      {grantedPermissions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
            Granted
          </span>
          <div className="flex flex-col gap-1.5">
            {grantedPermissions.map((p) => (
              <div
                key={p.id}
                className="border-dash-line flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[13px]"
              >
                <CheckIcon className="text-dash-green h-3.5 w-3.5 shrink-0" />
                <span className="text-dash-ink-2 font-mono">{p.action}</span>
                {p.policy_limits && (
                  <span className="text-dash-muted ml-auto font-mono text-[11px]">
                    {JSON.stringify(p.policy_limits)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="button" onClick={onContinue} data-testid="permissions-continue">
        {grantedPermissions.length > 0 ? 'Continue' : 'Skip & continue'}
      </Button>
    </div>
  );
}
