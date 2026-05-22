import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { pendingActionsCountQueryOptions } from '@/modules/approvals/lib/pending-actions-query';

import { InboxIcon, ListIcon } from '../lib/dashboard-icons';
import { QuickActionCard } from './quick-action-card';

function usePendingCountSubtitle(): { count: number | undefined; subtitle: string } {
  const { data } = useQuery(pendingActionsCountQueryOptions);
  const count = data?.count;
  if (count === undefined) return { count: undefined, subtitle: 'Loading...' };
  if (count === 0) return { count: undefined, subtitle: 'No new requests' };
  return {
    count,
    subtitle: `${count} pending request${count === 1 ? '' : 's'} waiting on your review`,
  };
}

export function QuickActionsGrid() {
  const { count, subtitle } = usePendingCountSubtitle();

  return (
    <section className="mb-8 grid grid-cols-2 gap-3 max-[1180px]:grid-cols-1">
      <Link to="/dashboard/approvals" className="contents">
        <QuickActionCard
          icon={
            <span className="bg-dash-amber-bg text-dash-amber inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]">
              <InboxIcon className="h-[17px] w-[17px]" />
            </span>
          }
          title="Approval Inbox"
          count={count}
          countColor="amber"
          subtitle={subtitle}
        />
      </Link>
      <Link to="/dashboard/audit-logs" className="contents">
        <QuickActionCard
          icon={
            <span className="text-dash-sky-4 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#E3F0FF]">
              <ListIcon className="h-[17px] w-[17px]" />
            </span>
          }
          title="Audit Logs"
          subtitle="View activity, key rotations & revocations"
        />
      </Link>
    </section>
  );
}
