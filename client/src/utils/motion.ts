import type { Transition, Variants } from "framer-motion";

export const motionDurations = {
  micro: 0.12,
  standard: 0.18,
  page: 0.24,
  sheet: 0.26,
} as const;

export const motionDistances = {
  subtle: 8,
  standard: 16,
  strong: 48,
} as const;

export const motionEasings = {
  standard: [0.2, 0, 0, 1],
  enter: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
} as const;

export const standardTransition: Transition = {
  duration: motionDurations.standard,
  ease: motionEasings.standard,
};

export const pageTransition: Transition = {
  duration: motionDurations.page,
  ease: motionEasings.enter,
};

export const sheetSpringTransition: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 34,
  mass: 0.9,
};

export const getDuration = (
  duration: number,
  prefersReducedMotion: boolean | null
) => (prefersReducedMotion ? 0 : duration);

export const fadeMotion: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUpMotion: Variants = {
  initial: { opacity: 0, y: motionDistances.standard },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: motionDistances.subtle },
};

export const createHorizontalSlideMotion = (
  distance = motionDistances.strong
): Variants => ({
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? distance : -distance,
  }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -distance : distance,
  }),
});
