import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

import type { AgentPermission } from '@lakitu/api/permissions';

import { RiskBadge } from '@repo/ui/components/risk-badge';
import { Button } from '@repo/ui/shadcn/button';
import type { RiskLevel } from '@repo/ui/components/risk-badge';

interface ToolAccessListProps {
  items: AgentPermission[];
  toolRiskMap: Record<string, RiskLevel>;
  onRevoke: (toolKey: string) => Promise<void>;
}

export function ToolAccessList({ items, toolRiskMap, onRevoke }: ToolAccessListProps) {
  const [revokingKey, setRevokingKey] = useState<string | null>(null);

  const handleRevoke = async (toolKey: string) => {
    setRevokingKey(toolKey);
    try {
      await onRevoke(toolKey);
    } finally {
      setRevokingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-dash-muted text-[11.5px] font-semibold tracking-[0.04em] uppercase">
        Granted Tools
      </span>
      <div className="flex flex-col gap-1.5">
        {items.map((p) => (
          <div
            key={p.id}
            data-testid={`granted-tool-row-${p.tool_key}`}
            className="border-dash-line flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[13px]"
          >
            <span className="text-dash-ink-2 flex-1 font-mono">{p.tool_key}</span>
            {toolRiskMap[p.tool_key] ? <RiskBadge level={toolRiskMap[p.tool_key]!} /> : null}
            {p.policy_limits && (
              <span className="text-dash-muted font-mono text-[11px]">
                {JSON.stringify(p.policy_limits)}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid={`granted-tool-revoke-${p.tool_key}`}
              className="h-6 w-6 shrink-0"
              disabled={revokingKey === p.tool_key}
              onClick={() => handleRevoke(p.tool_key)}
            >
              {revokingKey === p.tool_key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
