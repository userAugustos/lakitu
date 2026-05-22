import { Outlet, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

function getDepth(path: string): number {
  return path.replace(/\/$/, '').split('/').length;
}

export function AnimatedOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathRef = useRef(pathname);

  const prevDepth = getDepth(prevPathRef.current);
  const currDepth = getDepth(pathname);
  const goingDeeper = currDepth >= prevDepth;

  if (prevPathRef.current !== pathname) {
    prevPathRef.current = pathname;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: goingDeeper ? 24 : -24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: goingDeeper ? -24 : 24 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
