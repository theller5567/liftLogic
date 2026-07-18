import { motion, useReducedMotion } from "framer-motion";

import type { ExerciseDefinition } from "../../../../shared/constants/exercise-library";
import styles from "../../styles/pages/exerciseLibrary.module.scss";
import {
  getDuration,
  motionDurations,
  motionEasings,
} from "../../utils/motion";
import ExerciseLibraryCard from "./ExerciseLibraryCard";

const MAX_STAGGERED_CARDS = 12;

type ExerciseLibraryResultsProps = {
  exercises: ExerciseDefinition[];
  motionKey: string;
};

const ExerciseLibraryResults = ({
  exercises,
  motionKey,
}: ExerciseLibraryResultsProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key={motionKey}
      className={styles.exerciseGrid}
      initial={prefersReducedMotion ? false : "initial"}
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.018,
          },
        },
      }}
    >
      {exercises.map((exercise, index) => (
        <motion.div
          key={exercise.id}
          variants={{
            initial: {
              opacity: index < MAX_STAGGERED_CARDS ? 0 : 1,
              y: index < MAX_STAGGERED_CARDS ? 10 : 0,
            },
            animate: { opacity: 1, y: 0 },
          }}
          transition={{
            duration: getDuration(motionDurations.standard, prefersReducedMotion),
            ease: motionEasings.enter,
          }}
        >
          <ExerciseLibraryCard exercise={exercise} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ExerciseLibraryResults;
