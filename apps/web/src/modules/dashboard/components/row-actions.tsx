import { EditIcon, RevokeIcon, RotateIcon } from '../lib/dashboard-icons';

interface RowActionsProps {
  isRevoked: boolean;
}

export function RowActions({ isRevoked }: RowActionsProps) {
  return (
    <div className="inline-flex w-full items-center justify-end gap-1">
      <button
        type="button"
        className="text-dash-ink-2 hover:text-dash-red relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#F3C9C2] hover:bg-[#FFF6F4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
        data-tip="Revoke agent"
        disabled={isRevoked}
        aria-label="Revoke agent"
      >
        <RevokeIcon className="h-[15px] w-[15px]" />
      </button>
      <button
        type="button"
        className="text-dash-ink-2 hover:text-dash-sky-4 relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:border-[#BFDDFC] hover:bg-[#F1F8FF] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
        data-tip="Rotate key"
        disabled={isRevoked}
        aria-label="Rotate key"
      >
        <RotateIcon className="h-[15px] w-[15px]" />
      </button>
      <button
        type="button"
        className="text-dash-ink-2 hover:border-dash-line hover:text-dash-ink relative inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-transparent bg-transparent hover:bg-white"
        data-tip="More actions"
        aria-label="More actions"
      >
        <EditIcon className="h-[15px] w-[15px]" />
      </button>
    </div>
  );
}
