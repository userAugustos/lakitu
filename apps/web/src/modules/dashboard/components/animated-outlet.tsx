import { Outlet, useRouterState } from '@tanstack/react-router';
import { useRef } from 'react';

function getDepth(path: string): number {
  return path.replace(/\/$/, '').split('/').length;
}

export function AnimatedOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathRef = useRef<string | null>(null);

  let animationName: string | undefined;
  if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
    const prevDepth = getDepth(prevPathRef.current);
    const currDepth = getDepth(pathname);
    animationName = currDepth >= prevDepth ? 'dash-slide-in-right' : 'dash-slide-in-left';
  }

  prevPathRef.current = pathname;

  return (
    <div
      key={pathname}
      style={animationName ? { animation: `${animationName} 0.28s ease-out both` } : undefined}
    >
      <Outlet />
    </div>
  );
}
