import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import IconDumbbell from "../assets/icons/dumbbell.svg?react";
import IconGrowth from "../assets/icons/growth.svg?react";
import IconTarget from "../assets/icons/target.svg?react";

import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import { getCurrentWorkoutPlan, isApiEnabled } from "../services/api";
import {
  readSubmittedAnswers,
  readWorkoutReviewed,
} from "../utils/workoutStorage";
import styles from "../styles/pages/auth.module.scss";

type HomeDestination = "/onboarding" | "/workout-review" | "/dashboard" | null;

const getLocalDestination = (): Exclude<HomeDestination, null> => {
  const submittedAnswers = readSubmittedAnswers();

  if (!submittedAnswers) {
    return "/onboarding";
  }

  if (readWorkoutReviewed()) {
    return "/dashboard";
  }

  return "/workout-review";
};

const Home = () => {
  const { isConfigured, isLoading, signInWithGoogle, user } = useAuth();
  const [destination, setDestination] = useState<HomeDestination>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    let isCurrent = true;

    getCurrentWorkoutPlan()
      .then(({ workoutPlan }) => {
        if (!isCurrent) {
          return;
        }

        if (!workoutPlan) {
          setDestination("/onboarding");
          return;
        }

        setDestination(
          workoutPlan.workoutReviewed ? "/dashboard" : "/workout-review"
        );
      })
      .catch((apiError) => {
        console.error("Failed to load workout plan from API", apiError);

        if (isCurrent) {
          setDestination(getLocalDestination());
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isLoading, user]);

  const handleGoogleSignIn = async () => {
    setError(null);

    try {
      await signInWithGoogle();
    } catch (signInError) {
      console.error("Google sign-in failed", signInError);
      setError(
        isConfigured
          ? "Google sign-in could not be completed. Please try again."
          : "Firebase is not configured yet."
      );
    }
  };

  if (user && !isApiEnabled()) {
    return <Navigate to={getLocalDestination()} replace />;
  }

  if (user && destination) {
    return <Navigate to={destination} replace />;
  }

  return (
    <section className={styles.authShell}>
      <div className={styles.splash}>
        {/* <motion.div
          aria-hidden="true"
          className={styles.logoMark}
          initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.58, ease: "easeOut" }}
        >
          LL
        </motion.div> */}

        <div className={styles.copy}>
          <motion.h1
            className={styles.logoSplash}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            <span>Lift</span>Logic
          </motion.h1>

          <motion.div
            className={styles.copyContent}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.42, ease: "easeOut" }}
          >
          <h2 className={styles.eyebrow}>Build your first smart program.</h2>
          <div className={styles.showcase}>
            <div className={styles.showcaseItem}>
              <IconTarget className={styles.showcaseIcon} aria-hidden="true" />
              <p className={styles.title}>SMART PROGRAMS</p>
              <p className={styles.showcaseText}>Personalized training that adapts to you.</p>
            </div>
            <div className={styles.showcaseItem}>
              <IconGrowth className={styles.showcaseIcon} aria-hidden="true" />
              <p className={styles.title}>PROGRESS DRIVEN</p>
              <p className={styles.showcaseText}>Track, analyze and improve every week.</p>
            </div>
            <div className={styles.showcaseItem}>
              <IconDumbbell className={styles.showcaseIcon} aria-hidden="true" />
              <p className={styles.title}>BUILT FOR RESULTS</p>
              <p className={styles.showcaseText}>Science backed training for real results.</p>
            </div>
          </div>
          {/* <p className={styles.body}>
            Sign in with Google to save your onboarding answers, workout review, and future training data.
          </p> */}
          </motion.div>
        </div>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.42, ease: "easeOut" }}
        >
          <Button
            label="Continue with Google"
            tone="primary"
            size="large"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            icon="google"
          />
          <div className={styles.lineBreak}><span>OR</span></div>
          <Button
            label="Create Account"
            tone="secondary"
            size="large"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
        </motion.div>
      </div>
    </section>
  );
};

export default Home;
