export const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
};

export const shimmerTransition = {
  duration: 1,
  repeat: Infinity,
  ease: 'linear' as const,
};

const ENTER_DELAY = 0.15;

export const fadeVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      delay: ENTER_DELAY,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
};

export const slideVariants = {
  hiddenRight: {
    opacity: 0,
    x: 60,
  },
  hiddenLeft: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      delay: ENTER_DELAY,
      ease: 'easeOut' as const,
    },
  },
  exitLeft: {
    opacity: 0,
    x: -60,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
  exitRight: {
    opacity: 0,
    x: 60,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
};
