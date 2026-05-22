import { Outlet, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

import { slideVariants } from '../lib/motion.config';

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
        variants={slideVariants}
        initial={goingDeeper ? 'hiddenRight' : 'hiddenLeft'}
        animate="visible"
        exit={goingDeeper ? 'exitLeft' : 'exitRight'}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
