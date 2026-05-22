import { createFileRoute } from '@tanstack/react-router';
import { useMachine } from '@xstate/react';
import { Loader2 } from 'lucide-react';

import { ClawkeyStep } from '@/modules/dashboard/components/clawkey-step';
import { DoneStep } from '@/modules/dashboard/components/done-step';
import { NamingStep } from '@/modules/dashboard/components/naming-step';
import { PermissionsStep } from '@/modules/dashboard/components/permissions-step';
import { StepIndicator } from '@/modules/dashboard/components/step-indicator';
import { createAgentMachine } from '@/modules/dashboard/create-agent.machine';

const STEPS = ['Name', 'Permissions', 'ClawKey', 'Done'];

const SCREEN_TO_STEP: Record<string, number> = {
  naming: 1,
  creating: 1,
  permissions: 2,
  clawkey: 3,
  done: 4,
};

export const Route = createFileRoute('/_authenticated/dashboard/create-agent')({
  component: CreateAgentPage,
});

function CreateAgentPage() {
  const [state, send] = useMachine(createAgentMachine);
  const { screen, name, agent, privateKey, registrationUrl, grantedPermissions, error } =
    state.context;
  const isSubmitting = state.matches('creating');
  const isGranting = state.matches({ permissions: 'granting' });
  const currentStep = SCREEN_TO_STEP[screen] ?? 1;

  const content = (() => {
    switch (screen) {
      case 'naming':
      case 'creating':
        return (
          <NamingStep
            onSubmit={(n) => send({ type: 'SUBMIT_NAME', name: n })}
            isSubmitting={isSubmitting}
            error={error?.message ?? null}
          />
        );
      case 'permissions':
        return (
          <PermissionsStep
            agentName={agent?.name ?? name}
            grantedPermissions={grantedPermissions}
            onAddPermission={(action) => send({ type: 'ADD_PERMISSION', action })}
            onContinue={() => send({ type: 'CONTINUE' })}
            isGranting={isGranting}
            error={error?.message ?? null}
          />
        );
      case 'clawkey':
        return (
          <ClawkeyStep
            registrationUrl={registrationUrl!}
            privateKey={privateKey!}
            onConfirm={() => send({ type: 'CONFIRM' })}
          />
        );
      case 'done':
        return <DoneStep agentName={agent?.name ?? name} />;
      default:
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-dash-muted animate-spin" />
          </div>
        );
    }
  })();

  return (
    <div className="mx-auto max-w-lg py-8">
      <StepIndicator currentStep={currentStep} steps={STEPS} />
      <div className="border-dash-line rounded-2xl border bg-white p-8">{content}</div>
    </div>
  );
}
