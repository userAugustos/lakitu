import type { ReactNode } from 'react';

import { ArrowRightIcon } from '../lib/dashboard-icons';

const COUNT_COLORS = {
  amber: 'bg-dash-amber-bg text-dash-amber',
  red: 'bg-dash-red-bg text-dash-red',
} as const;

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  count?: number;
  countColor?: 'amber' | 'red';
  subtitle: string;
  testId?: string;
}

export function QuickActionCard({
  icon,
  title,
  count,
  countColor,
  subtitle,
  testId,
}: QuickActionCardProps) {
  return (
    <div
      data-testid={testId}
      className="group border-dash-line hover:border-dash-line-2 flex cursor-pointer items-center gap-3.5 rounded-xl border bg-white px-4 py-3.5 transition-[border-color,box-shadow,transform] duration-[120ms] ease-[ease] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(11,27,51,0.06)]"
    >
      {icon}
      <div className="min-w-0 flex-1 leading-[1.3]">
        <div className="text-dash-ink inline-flex items-center gap-2 text-[14px] font-semibold">
          {title}
          {count != null && (
            <span
              className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11.5px] font-bold ${
                countColor ? COUNT_COLORS[countColor] : 'bg-dash-gray-bg text-dash-ink-2'
              }`}
            >
              {count}
            </span>
          )}
        </div>
        <div className="text-dash-muted mt-0.5 text-[12.5px]">{subtitle}</div>
      </div>
      <ArrowRightIcon className="text-dash-muted group-hover:text-dash-ink h-4 w-4 shrink-0 transition-[transform,color] duration-[160ms] ease-[ease] group-hover:translate-x-[3px]" />
    </div>
  );
}
