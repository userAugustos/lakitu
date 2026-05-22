import { useQuery } from '@tanstack/react-query';

import { myCompanyQueryOptions } from '../lib/my-company-query';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function CompanyFloat() {
  const { data } = useQuery(myCompanyQueryOptions);

  if (!data?.company) return null;

  const { company, member_count } = data;

  return (
    <div
      data-testid="company-float"
      className="border-dash-line fixed bottom-5 left-5 z-20 inline-flex items-center gap-2.5 rounded-xl border bg-white py-2.5 pr-3.5 pl-2.5 max-[880px]:hidden"
      style={{
        boxShadow: '0 10px 24px rgba(11,27,51,0.10), 0 2px 6px rgba(11,27,51,0.06)',
      }}
    >
      <div
        className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #1E73CC, #0B1B33)' }}
      >
        {getInitials(company.name)}
      </div>
      <div className="min-w-0">
        <div className="text-dash-ink truncate text-[13px] leading-[1.2] font-semibold">
          {company.name}
        </div>
        <div className="text-dash-muted text-[11.5px] leading-[1.2]">
          {member_count} {member_count === 1 ? 'member' : 'members'}
        </div>
      </div>
    </div>
  );
}
