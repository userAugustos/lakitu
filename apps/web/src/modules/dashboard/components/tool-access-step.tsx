import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { ActorRefFrom, SnapshotFrom } from 'xstate';

import type { RevokePermissionResponse } from '@lakitu/api/permissions';
import type { RiskLevel, Tool } from '@lakitu/api/tools';

import { RiskBadge } from '@repo/ui/components/risk-badge';
import { Button } from '@repo/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/shadcn/select';
import { apiCall, lakituAuthApi } from '@/api';
import { toolsQueryOptions } from '@/modules/tools/lib/tools-query';

import { AutoApproveToggle } from './auto-approve-toggle';
import { CriticalToolBanner } from './critical-tool-banner';
import { ToolAccessList } from './tool-access-list';
import { ToolPolicyFields } from './tool-policy-fields';
import type { createAgentMachine } from '../create-agent.machine';

const RISK_EXPLAINER: Record<RiskLevel, string> = {
  low: 'Low risk — requests are automatically approved.',
  medium: 'Medium risk — requests are automatically approved.',
  high: 'High risk — requests require manual approval unless auto-approve is enabled.',
  critical: 'Critical risk — every request requires manual approval.',
};

interface ToolAccessStepProps {
  snapshot: SnapshotFrom<typeof createAgentMachine>;
  send: ActorRefFrom<typeof createAgentMachine>['send'];
  agentId: string;
  agentName: string;
}

export function ToolAccessStep({ snapshot, send, agentId, agentName }: ToolAccessStepProps) {
  const { data: toolsData } = useQuery(toolsQueryOptions());

  const [selectedToolKey, setSelectedToolKey] = useState<string>('');
  const [policyValues, setPolicyValues] = useState<Record<string, string>>({});
  const [autoApprove, setAutoApprove] = useState(false);

  const tools = toolsData?.tools ?? [];
  const { grantedPermissions, error } = snapshot.context;
  const isGranting = snapshot.matches({ permissions: 'granting' });

  const grantedKeys = new Set(grantedPermissions.map((p) => p.tool_key));
  const availableTools = tools.filter((t) => !grantedKeys.has(t.key));

  const selectedTool: Tool | undefined = tools.find((t) => t.key === selectedToolKey);

  const canSubmit =
    !!selectedTool &&
    !isGranting &&
    selectedTool.policy_fields.every((f) => {
      const v = policyValues[f.key];
      if (!v?.trim()) return false;
      if (f.type === 'number') return Number.isFinite(Number(v));
      return true;
    });

  const toolRiskMap = Object.fromEntries(tools.map((t) => [t.key, t.risk_level])) as Record<
    string,
    RiskLevel
  >;

  const handleSelectTool = (key: string) => {
    setSelectedToolKey(key);
    setPolicyValues({});
    setAutoApprove(false);
  };

  const handleGrantAccess = () => {
    if (!selectedTool) return;

    const policyLimits: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(policyValues)) {
      const field = selectedTool.policy_fields.find((f) => f.key === key);
      policyLimits[key] = field?.type === 'number' ? Number(val) : val;
    }

    send({
      type: 'ADD_PERMISSION',
      toolKey: selectedToolKey,
      policyLimits: Object.keys(policyLimits).length > 0 ? policyLimits : null,
      autoApprove: selectedTool.risk_level === 'high' ? autoApprove : false,
    });

    setSelectedToolKey('');
    setPolicyValues({});
    setAutoApprove(false);
  };

  const handleRevoke = async (revokeKey: string) => {
    await apiCall<RevokePermissionResponse>(() =>
      lakituAuthApi.agents[agentId]!.permissions[revokeKey]!.delete()
    );
    send({ type: 'REMOVE_PERMISSION', toolKey: revokeKey });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-dash-ink text-[16px] font-semibold">Tool Access for {agentName}</h3>
        <p className="text-dash-muted mt-1 text-[13px]">
          Grant tool access to define what this agent can do. You can skip this and add them later.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Select value={selectedToolKey} onValueChange={handleSelectTool}>
          <SelectTrigger data-testid="tool-select-trigger">
            <SelectValue placeholder="Select a tool..." />
          </SelectTrigger>
          <SelectContent>
            {availableTools.map((t) => (
              <SelectItem key={t.key} value={t.key} data-testid={`tool-select-option-${t.key}`}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTool && (
          <>
            <div className="flex items-center gap-2">
              <span data-testid="tool-risk-badge">
                <RiskBadge level={selectedTool.risk_level} />
              </span>
              <span className="text-dash-muted text-[12px]">
                {RISK_EXPLAINER[selectedTool.risk_level]}
              </span>
            </div>

            {selectedTool.risk_level === 'critical' && <CriticalToolBanner />}

            {selectedTool.policy_fields.length > 0 && (
              <ToolPolicyFields
                tool={selectedTool}
                values={policyValues}
                onChange={(key, value) => setPolicyValues((prev) => ({ ...prev, [key]: value }))}
              />
            )}

            {selectedTool.risk_level === 'high' && (
              <AutoApproveToggle checked={autoApprove} onToggle={() => setAutoApprove((v) => !v)} />
            )}

            {error && <p className="text-destructive text-sm">{error.message}</p>}

            <Button
              type="button"
              variant="outline"
              data-testid="tool-access-submit"
              disabled={!canSubmit}
              onClick={handleGrantAccess}
              className="self-start"
            >
              {isGranting ? <Loader2 className="animate-spin" /> : 'Grant Access'}
            </Button>
          </>
        )}
      </div>

      {grantedPermissions.length > 0 && (
        <ToolAccessList
          items={grantedPermissions}
          toolRiskMap={toolRiskMap}
          onRevoke={handleRevoke}
        />
      )}

      <Button
        type="button"
        onClick={() => send({ type: 'CONTINUE' })}
        data-testid="tool-access-continue"
      >
        {grantedPermissions.length > 0 ? 'Continue' : 'Skip & continue'}
      </Button>
    </div>
  );
}
