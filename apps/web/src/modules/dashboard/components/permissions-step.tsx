import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import type { AgentPermission } from '@lakitu/api/permissions';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/shadcn/select';
import { FieldError } from '@/modules/auth/components/field-error';
import { PLATFORM_AGENT_ACTIONS } from '@/modules/core/lib/agent-actions';

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

function parsePositiveNumber(raw: string | undefined): number | null {
  const value = Number(raw);
  if (!raw?.trim() || !Number.isFinite(value) || value <= 0) return null;
  return value;
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
  const [policyErrors, setPolicyErrors] = useState<Record<string, string>>({});

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
    setValue,
    watch,
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    mode: 'onSubmit',
    defaultValues: { action: undefined, policyMaxValue: '', policyMaxByDay: '' },
  });

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  const onValid = (data: PermissionFormValues) => {
    setDirty(false);
    setPolicyErrors({});

    const selectedAction = PLATFORM_AGENT_ACTIONS.find((action) => action.value === data.action);
    const policyLimits: Record<string, unknown> = {};
    const nextPolicyErrors: Record<string, string> = {};

    for (const field of selectedAction?.policyFields ?? []) {
      const formValue = field.key === 'max_value' ? data.policyMaxValue : data.policyMaxByDay;
      const parsedValue = parsePositiveNumber(formValue);
      if (parsedValue === null) {
        nextPolicyErrors[field.key] = `${field.label} is required`;
      } else {
        policyLimits[field.key] = parsedValue;
      }
    }

    if (Object.keys(nextPolicyErrors).length > 0) {
      setPolicyErrors(nextPolicyErrors);
      return;
    }

    onAddPermission(data.action, Object.keys(policyLimits).length > 0 ? policyLimits : null);
    reset({ action: undefined, policyMaxValue: '', policyMaxByDay: '' });
  };

  const actionValue = watch('action');
  const selectedAction = PLATFORM_AGENT_ACTIONS.find((action) => action.value === actionValue);
  const grantedActionValues = new Set(grantedPermissions.map((permission) => permission.action));
  const availableActions = PLATFORM_AGENT_ACTIONS.filter(
    (action) => !grantedActionValues.has(action.value)
  );
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
          <Controller
            control={control}
            name="action"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue('policyMaxValue', '');
                  setValue('policyMaxByDay', '');
                  setPolicyErrors({});
                  setDirty(true);
                  clearErrors('action');
                }}
              >
                <SelectTrigger
                  id="permission-action"
                  data-testid="permission-action-select"
                  className={
                    visibleError ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]' : ''
                  }
                >
                  <SelectValue placeholder="Select an action..." />
                </SelectTrigger>
                <SelectContent>
                  {availableActions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {selectedAction ? (
            <p className="text-dash-muted text-[11px]">{selectedAction.description}</p>
          ) : (
            <p className="text-dash-muted text-[11px]">
              Choose one of the platform actions this agent can perform.
            </p>
          )}
          <FieldError message={visibleError} />
        </div>

        {selectedAction && selectedAction.policyFields.length > 0 && (
          <div className="border-dash-line bg-dash-paper flex flex-col gap-3 rounded-xl border p-3">
            <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
              Policy limits
            </span>
            {selectedAction.policyFields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`policy-${field.key}`}
                  className="text-xs font-semibold tracking-wide"
                >
                  {field.label}
                </Label>
                <Input
                  id={`policy-${field.key}`}
                  type="number"
                  min="1"
                  step="1"
                  placeholder={field.placeholder}
                  data-testid={`policy-${field.key.replace(/_/g, '-')}-input`}
                  className={
                    policyErrors[field.key]
                      ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]'
                      : ''
                  }
                  value={
                    field.key === 'max_value' ? watch('policyMaxValue') : watch('policyMaxByDay')
                  }
                  onChange={(event) => {
                    setValue(
                      field.key === 'max_value' ? 'policyMaxValue' : 'policyMaxByDay',
                      event.target.value
                    );
                    setPolicyErrors((current) => {
                      const { [field.key]: _removed, ...rest } = current;
                      return rest;
                    });
                  }}
                />
                <p className="text-dash-muted text-[11px]">{field.description}</p>
                <FieldError message={policyErrors[field.key]} />
              </div>
            ))}
          </div>
        )}

        <Button
          type="submit"
          disabled={isGranting || availableActions.length === 0}
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
