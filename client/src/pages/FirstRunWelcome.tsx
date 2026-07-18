import { motion, useReducedMotion } from "framer-motion";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import IconDumbbell from "../assets/icons/dumbbell.svg?react";
import IconGrowth from "../assets/icons/growth.svg?react";
import IconTarget from "../assets/icons/target.svg?react";

import type { OnboardingMode } from "../../../shared/types/onboarding.types";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLoadingState from "../components/PageLoadingState";
import { useUserFlow } from "../utils/userFlow";
import {
  writeDraftAnswers,
  writeDraftStepIndex,
} from "../utils/workoutStorage";
import styles from "../styles/pages/firstRunWelcome.module.scss";

const features = [
  {
    description:
      "Your workouts are built around repeatable progress, not random exercises.",
    Icon: IconTarget,
    title: "Progressive overload first",
  },
  {
    description:
      "Track sets, reps, weight, notes, badges, and rest so next time has context.",
    Icon: IconDumbbell,
    title: "Remember every workout",
  },
  {
    description:
      "LiftLogic helps you decide when to increase, repeat, or hold steady.",
    Icon: IconGrowth,
    title: "Make smarter jumps",
  },
];

const FirstRunWelcome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const { destination, error, isLoading, refresh } = useUserFlow();
  const isPreviewMode = searchParams.get("preview") === "1";
  const shouldAnimate = !prefersReducedMotion;

  const startOnboarding = (onboardingMode: OnboardingMode) => {
    writeDraftAnswers({ onboardingMode });
    writeDraftStepIndex(1);
    navigate("/onboarding");
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Preparing LiftLogic..." />;
  }

  if (error) {
    return (
      <PageLoadingState
        tone="error"
        title="We could not prepare setup"
        message={error.message}
        onAction={refresh}
      />
    );
  }

  if (!isPreviewMode && destination && destination !== "/welcome") {
    return <Navigate to={destination} replace />;
  }

  return (
    <section className={styles.shell}>
      <motion.div
        className={styles.panel}
        initial={shouldAnimate ? { opacity: 0, y: 18 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className={styles.brandBlock}>
          <motion.p
            className={styles.logo}
            initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <span>Lift</span>Logic
          </motion.p>
          <motion.div
            aria-hidden="true"
            className={styles.progressLine}
            initial={shouldAnimate ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.12, duration: 0.62, ease: "easeOut" }}
          />
        </div>

        <motion.div
          className={styles.copy}
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.38, ease: "easeOut" }}
        >
          <p className={styles.eyebrow}>First setup</p>
          <h1>Welcome to LiftLogic</h1>
          <p>
            Build a training plan that remembers what happened last time and
            helps you attack the next workout with a smarter target.
          </p>
        </motion.div>

        <div className={styles.features}>
          {features.map(({ description, Icon, title }, index) => (
            <motion.div
              key={title}
              className={styles.feature}
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.28 + index * 0.09,
                duration: 0.32,
                ease: "easeOut",
              }}
            >
              <Icon aria-hidden="true" className={styles.featureIcon} />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className={styles.actions}
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.32, ease: "easeOut" }}
        >
          <Button
            label="Build my starting plan"
            tone="primary"
            size="large"
            onClick={() => startOnboarding("guided")}
          />
          <Button
            label="Browse plans myself"
            tone="white"
            variant="outline"
            size="large"
            onClick={() => startOnboarding("browse")}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FirstRunWelcome;
