import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { AgentPermission } from '@lakitu/api/permissions';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';
import { FieldError } from '@/modules/auth/components/field-error';

import { permissionActionSchema } from '../create-agent.schemas';
import { CheckIcon } from '../lib/dashboard-icons';
import type { PermissionActionFormValues } from '../create-agent.schemas';

interface PermissionsStepProps {
  agentName: string;
  grantedPermissions: AgentPermission[];
  onAddPermission: (action: string) => void;
  onContinue: () => void;
  isGranting: boolean;
  error: string | null;
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
    reset,
  } = useForm<PermissionActionFormValues>({
    resolver: zodResolver(permissionActionSchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  const onValid = (data: PermissionActionFormValues) => {
    setDirty(false);
    onAddPermission(data.action);
    reset();
  };

  const { onChange: rhfOnChange, ...actionRegister } = register('action');
  const visibleError = dirty ? null : (errors.action?.message ?? error);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-dash-ink text-[16px] font-semibold">Permissions for {agentName}</h3>
        <p className="text-dash-muted mt-1 text-[13px]">
          Grant permissions to define what this agent can do. You can skip this and add them later.
        </p>
      </div>

      <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permission-action" className="text-xs font-semibold tracking-wide">
            Permission action
          </Label>
          <div className="flex gap-2">
            <Input
              id="permission-action"
              type="text"
              placeholder="e.g. read:telemetry"
              data-testid="permission-action-input"
              className={`flex-1 ${
                visibleError ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]' : ''
              }`}
              onChange={(e) => {
                void rhfOnChange(e);
                setDirty(true);
                clearErrors();
              }}
              {...actionRegister}
            />
            <Button
              type="submit"
              disabled={isGranting}
              variant="outline"
              data-testid="add-permission-submit"
            >
              {isGranting ? <Loader2 className="animate-spin" /> : 'Add'}
            </Button>
          </div>
          <FieldError message={visibleError} />
        </div>
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
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="button" onClick={onContinue} data-testid="permissions-continue">
        Continue
      </Button>
    </div>
  );
}
