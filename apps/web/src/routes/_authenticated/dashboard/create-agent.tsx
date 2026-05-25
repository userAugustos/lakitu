import { createFileRoute } from '@tanstack/react-router';
import { useActor } from '@xstate/react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { ClawkeyStep } from '@/modules/dashboard/components/clawkey-step';
import { DoneStep } from '@/modules/dashboard/components/done-step';
import { NamingStep } from '@/modules/dashboard/components/naming-step';
import { StepIndicator } from '@/modules/dashboard/components/step-indicator';
import { ToolAccessStep } from '@/modules/dashboard/components/tool-access-step';
import { createAgentMachine } from '@/modules/dashboard/create-agent.machine';
import { slideVariants } from '@/modules/dashboard/lib/motion.config';

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
  const [snapshot, send] = useActor(createAgentMachine);
  const { screen, name, agent, privateKey, registrationUrl, error } = snapshot.context;
  const isSubmitting = snapshot.matches('creating');
  const isBypassing = snapshot.matches({ clawkey: 'bypassing' });
  const currentStep = SCREEN_TO_STEP[screen] ?? 1;
  const viewKey = screen === 'creating' ? 'naming' : screen;

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
          <ToolAccessStep
            snapshot={snapshot}
            send={send}
            agentId={agent!.id}
            agentName={agent?.name ?? name}
          />
        );
      case 'clawkey':
        return (
          <ClawkeyStep
            registrationUrl={registrationUrl!}
            privateKey={privateKey!}
            onConfirm={() => send({ type: 'CONFIRM' })}
            onBypass={() => send({ type: 'BYPASS_CLAWKEY' })}
            isBypassing={isBypassing}
            error={error?.message ?? null}
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
      <div className="border-dash-line overflow-hidden rounded-2xl border bg-white p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewKey}
            variants={slideVariants}
            initial="hiddenRight"
            animate="visible"
            exit="exitLeft"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
