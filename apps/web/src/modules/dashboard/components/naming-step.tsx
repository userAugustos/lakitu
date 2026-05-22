import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';
import { FieldError } from '@/modules/auth/components/field-error';

import { agentNameSchema } from '../create-agent.schemas';
import type { AgentNameFormValues } from '../create-agent.schemas';

interface NamingStepProps {
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function NamingStep({ onSubmit, isSubmitting, error }: NamingStepProps) {
  const [dirty, setDirty] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<AgentNameFormValues>({
    resolver: zodResolver(agentNameSchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  const onValid = (data: AgentNameFormValues) => {
    setDirty(false);
    onSubmit(data.name);
  };

  const { onChange: rhfOnChange, ...nameRegister } = register('name');
  const visibleError = dirty ? null : (errors.name?.message ?? error);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="agent-name" className="text-xs font-semibold tracking-wide">
          Agent name
        </Label>
        <Input
          id="agent-name"
          type="text"
          autoFocus
          placeholder="e.g. Race Officiator"
          data-testid="agent-name-input"
          className={
            visibleError ? 'border-destructive shadow-[0_0_0_4px_rgba(230,57,70,0.12)]' : ''
          }
          onChange={(e) => {
            void rhfOnChange(e);
            setDirty(true);
            clearErrors();
          }}
          {...nameRegister}
        />
        <FieldError message={visibleError} />
      </div>

      <Button type="submit" disabled={isSubmitting} data-testid="create-agent-submit">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Creating...</span>
          </>
        ) : (
          <span>Create Agent</span>
        )}
      </Button>
    </form>
  );
}
