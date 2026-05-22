import { AgentCell } from './agent-cell';
import { ClawkeyPill } from './clawkey-pill';
import { RowActions } from './row-actions';
import { StatusPill } from './status-pill';
import { TimeCell } from './time-cell';
import type { AgentDisplayRow } from '../lib/agent-display';

interface AgentRowProps {
  agent: AgentDisplayRow;
}

export function AgentRow({ agent }: AgentRowProps) {
  return (
    <tr className={`hover:bg-[#FAFBFD] ${agent.isRevoked ? 'is-revoked' : ''}`}>
      <td className="border-dash-line-3 border-b px-4 py-3.5 align-middle">
        <AgentCell
          name={agent.name}
          id={agent.id}
          initials={agent.initials}
          colorVariant={agent.colorVariant}
          isRevoked={agent.isRevoked}
        />
      </td>
      <td className="border-dash-line-3 border-b px-4 py-3.5 align-middle">
        <StatusPill status={agent.status} label={agent.statusLabel} />
      </td>
      <td className="border-dash-line-3 border-b px-4 py-3.5 align-middle">
        <TimeCell relative={agent.editedRelative} absolute={agent.editedAbsolute} />
      </td>
      <td className="border-dash-line-3 border-b px-4 py-3.5 align-middle">
        <ClawkeyPill
          state={agent.clawkeyState}
          label={agent.clawkeyLabel}
          note={agent.clawkeyNote}
        />
      </td>
      <td className="border-dash-line-3 border-b px-4 py-3.5 text-right align-middle">
        <RowActions isRevoked={agent.isRevoked} />
      </td>
    </tr>
  );
}
