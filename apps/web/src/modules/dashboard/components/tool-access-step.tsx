import { useQuery } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import { Loader2 } from 'lucide-react';

import type { RevokePermissionResponse } from '@lakitu/api/permissions';
import type { RiskLevel } from '@lakitu/api/tools';

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

import { createToolAccessMachine } from '../tool-access.machine';
import { AutoApproveToggle } from './auto-approve-toggle';
import { CriticalToolBanner } from './critical-tool-banner';
import { ToolAccessList } from './tool-access-list';
import { ToolPolicyFields } from './tool-policy-fields';

const RISK_EXPLAINER: Record<RiskLevel, string> = {
  low: 'Low risk — requests are automatically approved.',
  medium: 'Medium risk — requests are automatically approved.',
  high: 'High risk — requests require manual approval unless auto-approve is enabled.',
  critical: 'Critical risk — every request requires manual approval.',
};

interface ToolAccessStepProps {
  agentId: string;
  agentName: string;
  onContinue: () => void;
}

export function ToolAccessStep({ agentId, agentName, onContinue }: ToolAccessStepProps) {
  const [state, send] = useMachine(createToolAccessMachine(agentId));
  const { data: toolsData } = useQuery(toolsQueryOptions());

  const tools = toolsData?.tools ?? [];
  const { tool, toolKey, policyValues, autoApprove, error, grantedPermissions } = state.context;
  const isSubmitting = state.matches('submitting');
  const hasToolSelected =
    state.matches('toolSelected') || state.matches('submitting') || state.matches('error');

  const grantedKeys = new Set(grantedPermissions.map((p) => p.tool_key));
  const availableTools = tools.filter((t) => !grantedKeys.has(t.key));

  const canSubmit =
    hasToolSelected &&
    !isSubmitting &&
    !!tool &&
    !!toolKey &&
    tool.policy_fields.every((f) => {
      const v = policyValues[f.key];
      if (!v?.trim()) return false;
      if (f.type === 'number') return Number.isFinite(Number(v));
      return true;
    });

  const toolRiskMap = Object.fromEntries(tools.map((t) => [t.key, t.risk_level])) as Record<
    string,
    RiskLevel
  >;

  const handleRevoke = async (revokeKey: string) => {
    await apiCall<RevokePermissionResponse>(() =>
      lakituAuthApi.agents[agentId]!.permissions[revokeKey]!.delete()
    );
    send({ type: 'REMOVE_GRANTED', toolKey: revokeKey });
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
        <Select
          value={toolKey ?? ''}
          onValueChange={(value) => {
            const selected = tools.find((t) => t.key === value);
            if (selected) send({ type: 'SELECT_TOOL', toolKey: value, tool: selected });
          }}
        >
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

        {tool && (
          <>
            <div className="flex items-center gap-2">
              <span data-testid="tool-risk-badge">
                <RiskBadge level={tool.risk_level} />
              </span>
              <span className="text-dash-muted text-[12px]">{RISK_EXPLAINER[tool.risk_level]}</span>
            </div>

            {tool.risk_level === 'critical' && <CriticalToolBanner />}

            {tool.policy_fields.length > 0 && (
              <ToolPolicyFields
                tool={tool}
                values={policyValues}
                onChange={(key, value) => send({ type: 'CHANGE_POLICY', key, value })}
              />
            )}

            {tool.risk_level === 'high' && (
              <AutoApproveToggle
                checked={autoApprove}
                onToggle={() => send({ type: 'TOGGLE_AUTO_APPROVE' })}
              />
            )}

            {error && <p className="text-destructive text-sm">{error.message}</p>}

            <Button
              type="button"
              variant="outline"
              data-testid="tool-access-submit"
              disabled={!canSubmit}
              onClick={() => send({ type: 'SUBMIT' })}
              className="self-start"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Grant Access'}
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

      <Button type="button" onClick={onContinue} data-testid="tool-access-continue">
        {grantedPermissions.length > 0 ? 'Continue' : 'Skip & continue'}
      </Button>
    </div>
  );
}
