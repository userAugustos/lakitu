import { Link } from '@tanstack/react-router';

import { InboxIcon, ListIcon } from '../lib/dashboard-icons';
import { QuickActionCard } from './quick-action-card';

export function QuickActionsGrid() {
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
          count={3}
          countColor="amber"
          subtitle="3 pending requests waiting on your review"
        />
      </Link>
      <QuickActionCard
        icon={
          <span className="text-dash-sky-4 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#E3F0FF]">
            <ListIcon className="h-[17px] w-[17px]" />
          </span>
        }
        title="Audit Logs"
        subtitle="View activity, key rotations & revocations"
      />
    </section>
  );
}
