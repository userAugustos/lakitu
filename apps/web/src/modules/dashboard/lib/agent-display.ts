import type { Agent } from '@lakitu/api/agents';

export interface AgentDisplayRow {
  name: string;
  id: string;
  initials: string;
  colorVariant: string;
  status: string;
  statusLabel: string;
  editedRelative: string;
  editedAbsolute: string;
  clawkeyState: string;
  clawkeyLabel: string;
  clawkeyNote: string;
  isRevoked: boolean;
}

export function getAgentInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

const COLOR_VARIANTS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'] as const;

export function getAgentColorVariant(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COLOR_VARIANTS[Math.abs(hash) % COLOR_VARIANTS.length]!;
}

export function formatRelativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  if (diff < 172_800_000) return 'Yesterday';

  const d = new Date(epochMs);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatAbsoluteTime(epochMs: number): string {
  const d = new Date(epochMs);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${hours}:${minutes}`;
}

function mapClawkeyStatus(agent: Agent): {
  state: string;
  label: string;
  note: string;
} {
  const shortId = agent.id.slice(-4);

  switch (agent.clawkey_status) {
    case 'completed':
      return {
        state: 'valid',
        label: `ck_live_••${shortId}`,
        note: 'Valid',
      };
    case 'pending':
      return {
        state: 'rotating',
        label: 'ck_live_••——',
        note: 'Rotation in progress',
      };
    case 'expired':
    case 'failed':
      return {
        state: 'revoked',
        label: 'ck_live_••XXXX',
        note: 'Key revoked',
      };
  }
}

function mapAgentStatus(agent: Agent): { status: string; label: string } {
  if (agent.status === 'revoked') return { status: 'revoked', label: 'Revoked' };
  return { status: 'active', label: 'Active' };
}

export function toAgentDisplayRow(agent: Agent): AgentDisplayRow {
  const { status, label: statusLabel } = mapAgentStatus(agent);
  const clawkey = mapClawkeyStatus(agent);

  return {
    name: agent.name,
    id: agent.id.length > 10 ? `agt_${agent.id.slice(-6)}` : agent.id,
    initials: getAgentInitials(agent.name),
    colorVariant: getAgentColorVariant(agent.id),
    status,
    statusLabel,
    editedRelative: formatRelativeTime(agent.updated_at),
    editedAbsolute: formatAbsoluteTime(agent.updated_at),
    clawkeyState: clawkey.state,
    clawkeyLabel: clawkey.label,
    clawkeyNote: clawkey.note,
    isRevoked: agent.status === 'revoked',
  };
}
