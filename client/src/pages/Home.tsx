import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";

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
        <motion.div
          aria-hidden="true"
          className={styles.logoMark}
          initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.58, ease: "easeOut" }}
        >
          LL
        </motion.div>

        <motion.div
          className={styles.copy}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.42, ease: "easeOut" }}
        >
          <p className={styles.eyebrow}>LiftLogic</p>
          <h1 className={styles.title}>Build your first smart program.</h1>
          <p className={styles.body}>
            Sign in with Google to save your onboarding answers, workout review, and future training data.
          </p>
        </motion.div>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.42, ease: "easeOut" }}
        >
          <Button
            label="Login with Google"
            tone="primary"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />
          <Button
            label="Create account"
            tone="secondary"
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
