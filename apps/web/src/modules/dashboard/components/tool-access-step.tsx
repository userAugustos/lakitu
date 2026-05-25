import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useReducer } from 'react';
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
import { cn } from '@repo/ui/utils';
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

interface FormState {
  selectedToolKey: string;
  policyValues: Record<string, string>;
  autoApprove: boolean;
  revokeError: string | null;
}

type FormAction =
  | { type: 'SELECT_TOOL'; toolKey: string }
  | { type: 'SET_POLICY_VALUE'; key: string; value: string }
  | { type: 'TOGGLE_AUTO_APPROVE' }
  | { type: 'RESET' }
  | { type: 'SET_REVOKE_ERROR'; message: string | null };

const initialFormState: FormState = {
  selectedToolKey: '',
  policyValues: {},
  autoApprove: false,
  revokeError: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SELECT_TOOL':
      return { ...initialFormState, selectedToolKey: action.toolKey };
    case 'SET_POLICY_VALUE':
      return { ...state, policyValues: { ...state.policyValues, [action.key]: action.value } };
    case 'TOGGLE_AUTO_APPROVE':
      return { ...state, autoApprove: !state.autoApprove };
    case 'RESET':
      return initialFormState;
    case 'SET_REVOKE_ERROR':
      return { ...state, revokeError: action.message };
  }
}

interface ToolAccessStepProps {
  snapshot: SnapshotFrom<typeof createAgentMachine>;
  send: ActorRefFrom<typeof createAgentMachine>['send'];
  agentId: string;
  agentName: string;
}

export function ToolAccessStep({ snapshot, send, agentId, agentName }: ToolAccessStepProps) {
  const { data: toolsData } = useQuery(toolsQueryOptions());
  const [form, dispatch] = useReducer(formReducer, initialFormState);
  const { selectedToolKey, policyValues, autoApprove, revokeError } = form;

  const tools = toolsData?.tools ?? [];
  const { grantedPermissions, error } = snapshot.context;
  const isGranting = snapshot.matches({ permissions: 'granting' });

  const grantedKeys = new Set(grantedPermissions.map((p) => p.tool_key));
  const availableTools = tools.filter((t) => !grantedKeys.has(t.key));

  const selectedTool: Tool | undefined = tools.find((t) => t.key === selectedToolKey);

  useEffect(() => {
    if (selectedToolKey && grantedPermissions.some((p) => p.tool_key === selectedToolKey)) {
      dispatch({ type: 'RESET' });
    }
  }, [grantedPermissions, selectedToolKey]);

  const canSubmit =
    !!selectedTool &&
    !isGranting &&
    selectedTool.policy_fields.every((f) => {
      const v = policyValues[f.key];
      if (!v?.trim()) return false;
      if (f.type === 'number') {
        const n = Number(v);
        return Number.isFinite(n) && n > 0;
      }
      return true;
    });

  const toolRiskMap = Object.fromEntries(tools.map((t) => [t.key, t.risk_level])) as Record<
    string,
    RiskLevel
  >;

  const handleSelectTool = (key: string) => {
    send({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'SELECT_TOOL', toolKey: key });
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
  };

  const handleRevoke = async (revokeKey: string) => {
    try {
      await apiCall<RevokePermissionResponse>(() =>
        lakituAuthApi.agents[agentId]!.permissions[revokeKey]!.delete()
      );
      dispatch({ type: 'SET_REVOKE_ERROR', message: null });
      send({ type: 'REMOVE_PERMISSION', toolKey: revokeKey });
    } catch (err) {
      dispatch({
        type: 'SET_REVOKE_ERROR',
        message: err instanceof Error ? err.message : 'Failed to revoke tool access',
      });
    }
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
                onChange={(key, value) => dispatch({ type: 'SET_POLICY_VALUE', key, value })}
              />
            )}

            {selectedTool.risk_level === 'high' && (
              <AutoApproveToggle
                checked={autoApprove}
                onToggle={() => dispatch({ type: 'TOGGLE_AUTO_APPROVE' })}
              />
            )}

            <p className={cn('text-destructive text-sm', !error && 'hidden')}>{error?.message}</p>

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
        <div className="flex flex-col gap-2">
          <ToolAccessList
            items={grantedPermissions}
            toolRiskMap={toolRiskMap}
            onRevoke={handleRevoke}
          />
          <p className={cn('text-destructive text-sm', !revokeError && 'hidden')}>{revokeError}</p>
        </div>
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
