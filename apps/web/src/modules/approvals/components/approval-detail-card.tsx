import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { PendingAction } from '@lakitu/api/pending-actions';

import { RiskBadge } from '@repo/ui/components/risk-badge';
import { Button } from '@repo/ui/shadcn/button';
import { Label } from '@repo/ui/shadcn/label';
import { Textarea } from '@repo/ui/shadcn/textarea';
import type { RiskLevel } from '@repo/ui/components/risk-badge';
import { toolsQueryOptions } from '@/modules/tools/lib/tools-query';

import { ApprovalStatusBadge } from './approval-status-badge';

function formatEpochFull(epoch: number): string {
  return new Date(epoch).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface ApprovalDetailCardProps {
  action: PendingAction;
  onBack: () => void;
  onApprove: (note?: string) => void;
  onDeny: (note?: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function ApprovalDetailCard({
  action,
  onBack,
  onApprove,
  onDeny,
  isLoading,
  error,
}: ApprovalDetailCardProps) {
  const [note, setNote] = useState('');
  const isPending = action.status === 'pending';
  const { data: toolsData } = useQuery(toolsQueryOptions());
  const tool = toolsData?.tools.find((t) => t.key === action.tool_key);

  return (
    <div
      data-testid="approval-detail-card"
      className="border-dash-line rounded-[14px] border bg-white p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="detail-back-btn"
          onClick={onBack}
        >
          &larr; Back to list
        </Button>
        <ApprovalStatusBadge status={action.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Agent" value={action.agent_name} />
        <DetailField label="Tool" value={action.tool_key} mono />
        {tool && (
          <div>
            <Label className="text-[11.5px] tracking-[0.04em] uppercase">Risk</Label>
            <div className="mt-0.5">
              <RiskBadge level={tool.risk_level as RiskLevel} />
            </div>
          </div>
        )}
        <DetailField label="Policy Hit" value={action.policy_hit} />
        <DetailField label="Status" value={action.status} />
        <DetailField label="Created" value={formatEpochFull(action.created_at)} />
        <DetailField label="Expires" value={formatEpochFull(action.expires_at)} />
        {action.resolved_at && (
          <DetailField label="Resolved At" value={formatEpochFull(action.resolved_at)} />
        )}
        {action.resolution_note && (
          <DetailField label="Resolution Note" value={action.resolution_note} />
        )}
      </div>

      {Object.keys(action.context).length > 0 && (
        <div className="mt-4">
          <Label className="text-[11.5px] tracking-[0.04em] uppercase">Context</Label>
          <pre className="border-dash-line text-dash-ink-2 mt-1.5 overflow-auto rounded-lg border bg-[#FAFBFD] p-3 font-mono text-[12px]">
            {JSON.stringify(action.context, null, 2)}
          </pre>
        </div>
      )}

      {isPending && (
        <div className="mt-6 border-t border-[#EAEDF2] pt-5">
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="resolution-note">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="resolution-note"
              data-testid="resolution-note"
              placeholder="Add a reason for this decision..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {error && <p className="text-destructive mb-3 text-sm">{error}</p>}

          <div className="flex gap-3">
            <Button
              type="button"
              data-testid="approve-btn"
              disabled={isLoading}
              onClick={() => onApprove(note || undefined)}
              className="w-auto bg-[#16a34a] px-5 text-white hover:bg-[#15803d]"
              size="sm"
            >
              Approve
            </Button>
            <Button
              type="button"
              data-testid="deny-btn"
              disabled={isLoading}
              onClick={() => onDeny(note || undefined)}
              variant="destructive"
              className="w-auto px-5"
              size="sm"
            >
              Deny
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label className="text-[11.5px] tracking-[0.04em] uppercase">{label}</Label>
      <p className={`text-dash-ink mt-0.5 text-[13.5px] ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
