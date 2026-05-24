import type { AuditLogListEntry } from '@lakitu/api/audit-log';

interface AuditLogDetailDrawerProps {
  entry: AuditLogListEntry;
}

export function AuditLogDetailDrawer({ entry }: AuditLogDetailDrawerProps) {
  return (
    <div className="border-dash-line border-t bg-[#FAFBFD] px-4 py-3 font-mono text-[12px]">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <DetailRow label="ID" value={entry.id} />
        <DetailRow label="Audit ID" value={entry.audit_id} />
        <DetailRow label="Agent ID" value={entry.agent_id} />
        <DetailRow label="Owner ID" value={entry.owner_id} />
        <DetailRow label="Company ID" value={entry.company_id} />
        <DetailRow label="Request ID" value={entry.request_id ?? '—'} />
        <DetailRow label="Policy Hit" value={entry.policy_hit ?? '—'} />
      </div>
      {entry.context && (
        <div className="mt-2">
          <span className="text-dash-muted text-[11px] font-semibold tracking-wide uppercase not-italic">
            Context
          </span>
          <pre className="text-dash-ink-2 mt-1 overflow-auto text-[11.5px]">
            {JSON.stringify(entry.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-dash-muted w-24 shrink-0">{label}:</span>
      <span className="text-dash-ink-2 break-all">{value}</span>
    </div>
  );
}
