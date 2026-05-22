import { createFileRoute, useLoaderData } from '@tanstack/react-router';

import type { Agent } from '@lakitu/api/agents';

import { AgentSectionHeader } from '@/modules/dashboard/components/agent-section-header';
import { AgentTable } from '@/modules/dashboard/components/agent-table';
import { TableFooter } from '@/modules/dashboard/components/table-footer';
import { toAgentDisplayRow } from '@/modules/dashboard/lib/agent-display';
import type { AgentDisplayRow } from '@/modules/dashboard/lib/agent-display';

const MOCK_AGENTS: AgentDisplayRow[] = [
  {
    name: 'Race Officiator',
    id: 'agt_8f3b21',
    initials: 'RO',
    colorVariant: 'v1',
    status: 'active',
    statusLabel: 'Active',
    editedRelative: '2 min ago',
    editedAbsolute: 'May 21, 10:14',
    clawkeyState: 'valid',
    clawkeyLabel: 'ck_live_••a7f4',
    clawkeyNote: 'Valid · rotates in 28d',
    isRevoked: false,
  },
  {
    name: 'Lap Counter',
    id: 'agt_2c91ee',
    initials: 'LC',
    colorVariant: 'v3',
    status: 'active',
    statusLabel: 'Active',
    editedRelative: '1 h ago',
    editedAbsolute: 'May 21, 09:02',
    clawkeyState: 'valid',
    clawkeyLabel: 'ck_live_••3c91',
    clawkeyNote: 'Valid · rotates in 12d',
    isRevoked: false,
  },
  {
    name: 'Finish-line Reviewer',
    id: 'agt_0d44a1',
    initials: 'FR',
    colorVariant: 'v2',
    status: 'warn',
    statusLabel: 'Degraded',
    editedRelative: 'Yesterday',
    editedAbsolute: 'May 20, 17:48',
    clawkeyState: 'expiring',
    clawkeyLabel: 'ck_live_••b220',
    clawkeyNote: 'Expires in 3 days',
    isRevoked: false,
  },
  {
    name: 'Penalty Adjudicator',
    id: 'agt_7c19fe',
    initials: 'PA',
    colorVariant: 'v5',
    status: 'error',
    statusLabel: 'Errored',
    editedRelative: '3 h ago',
    editedAbsolute: 'May 21, 07:38',
    clawkeyState: 'rotating',
    clawkeyLabel: 'ck_live_••——',
    clawkeyNote: 'Rotation in progress',
    isRevoked: false,
  },
  {
    name: 'Pre-race Inspector',
    id: 'agt_44ba01',
    initials: 'PI',
    colorVariant: 'v7',
    status: 'idle',
    statusLabel: 'Idle',
    editedRelative: '2 d ago',
    editedAbsolute: 'May 19, 12:01',
    clawkeyState: 'valid',
    clawkeyLabel: 'ck_live_••7d18',
    clawkeyNote: 'Valid · rotates in 41d',
    isRevoked: false,
  },
  {
    name: 'Course Caster',
    id: 'agt_b91230',
    initials: 'CC',
    colorVariant: 'v4',
    status: 'active',
    statusLabel: 'Active',
    editedRelative: '4 d ago',
    editedAbsolute: 'May 17, 15:23',
    clawkeyState: 'valid',
    clawkeyLabel: 'ck_live_••e102',
    clawkeyNote: 'Valid · rotates in 58d',
    isRevoked: false,
  },
  {
    name: 'Item Box Validator',
    id: 'agt_5a7711',
    initials: 'IB',
    colorVariant: 'v6',
    status: 'active',
    statusLabel: 'Active',
    editedRelative: 'May 18',
    editedAbsolute: 'May 18, 09:11',
    clawkeyState: 'valid',
    clawkeyLabel: 'ck_live_••0044',
    clawkeyNote: 'Valid · rotates in 19d',
    isRevoked: false,
  },
  {
    name: 'Boost Pad Auditor',
    id: 'agt_e0b22f',
    initials: 'BP',
    colorVariant: 'v1',
    status: 'revoked',
    statusLabel: 'Revoked',
    editedRelative: 'May 14',
    editedAbsolute: 'May 14, 11:50',
    clawkeyState: 'revoked',
    clawkeyLabel: 'ck_live_••XXXX',
    clawkeyNote: 'Key revoked',
    isRevoked: true,
  },
];

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { agents } = useLoaderData({ from: '/_authenticated/dashboard' });
  const displayAgents =
    agents.length > 0 ? agents.map((a: Agent) => toAgentDisplayRow(a)) : MOCK_AGENTS;

  return (
    <div>
      <AgentSectionHeader />
      <AgentTable
        agents={displayAgents}
        footer={<TableFooter total={displayAgents.length} pageSize={8} currentPage={1} />}
      />
    </div>
  );
}
