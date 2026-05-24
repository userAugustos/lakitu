import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMachine } from '@xstate/react';
import { useMemo, useState } from 'react';
import type { ColumnFiltersState } from '@tanstack/react-table';

import type { PendingActionStatusValue } from '@lakitu/api/pending-actions';

import { approvalsMachine } from '@/modules/approvals/approvals.machine';
import { ApprovalDetailCard } from '@/modules/approvals/components/approval-detail-card';
import { approvalsColumns } from '@/modules/approvals/components/approvals-columns';
import { ApprovalsDataTable } from '@/modules/approvals/components/approvals-data-table';
import { ApprovalsHeader } from '@/modules/approvals/components/approvals-header';
import { SimulateDialog } from '@/modules/approvals/components/simulate-dialog';
import { pendingActionsQueryOptions } from '@/modules/approvals/lib/pending-actions-query';

export const Route = createFileRoute('/_authenticated/dashboard/approvals')({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { data } = useQuery(pendingActionsQueryOptions);
  const [state, send] = useMachine(approvalsMachine);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const pendingActions = useMemo(() => data?.pending_actions ?? [], [data?.pending_actions]);

  const statusFilter = columnFilters.find((f) => f.id === 'status')?.value as
    | PendingActionStatusValue
    | undefined;
  const onFilterChange = (next: PendingActionStatusValue | undefined) =>
    setColumnFilters(next ? [{ id: 'status', value: next }] : []);

  const isResolving = state.matches('approving') || state.matches('denying');
  const isSimulating = state.matches('simulating');

  if (state.matches('detail') || isResolving) {
    return (
      <div data-testid="approvals-page">
        <ApprovalDetailCard
          action={state.context.selectedAction!}
          onBack={() => send({ type: 'BACK' })}
          onApprove={(note) => send({ type: 'APPROVE', note })}
          onDeny={(note) => send({ type: 'DENY', note })}
          isLoading={isResolving}
          error={state.context.error?.message ?? null}
        />
      </div>
    );
  }

  return (
    <div data-testid="approvals-page">
      <ApprovalsHeader
        statusFilter={statusFilter}
        onFilterChange={onFilterChange}
        onTriggerAction={() => send({ type: 'OPEN_SIMULATE' })}
      />
      <ApprovalsDataTable
        columns={approvalsColumns}
        data={pendingActions}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        onRowClick={(pendingAction) => send({ type: 'SELECT', pendingAction })}
      />
      <SimulateDialog
        open={state.context.simulateOpen}
        onClose={() => send({ type: 'CLOSE_SIMULATE' })}
        onSubmit={(payload) =>
          send({
            type: 'SUBMIT_SIMULATE',
            agent_id: payload.agent_id,
            tool_key: payload.tool_key,
            context: payload.context,
          })
        }
        isLoading={isSimulating}
        error={state.context.error?.message ?? null}
      />
    </div>
  );
}
