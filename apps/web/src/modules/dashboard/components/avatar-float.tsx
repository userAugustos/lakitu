import { authSelectors, useAuthStore } from '@/modules/auth/auth.store';

function getInitials(user: { name?: string | null; email: string }): string {
  if (user.name) {
    const parts = user.name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    return parts[0]![0]!.toUpperCase();
  }
  return user.email[0]!.toUpperCase();
}

export function AvatarFloat() {
  const user = useAuthStore(authSelectors.user);

  if (!user) return null;

  const initials = getInitials(user);

  return (
    <button
      type="button"
      title={user.name ?? user.email}
      data-testid="avatar-float"
      className="fixed top-[18px] right-6 z-20 inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border-2 border-white text-[13px] font-bold text-white transition-[transform,box-shadow] duration-[120ms] ease-[ease] hover:-translate-y-px"
      style={{
        background: 'linear-gradient(135deg, var(--dash-sky-2), var(--dash-sky-4))',
        boxShadow: '0 6px 16px rgba(11,27,51,0.16), 0 2px 4px rgba(11,27,51,0.08)',
      }}
    >
      {initials}
    </button>
  );
}
