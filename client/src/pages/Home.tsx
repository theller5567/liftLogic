import { useState } from "react";
import { motion } from "framer-motion";
import IconDumbbell from "../assets/icons/dumbbell.svg?react";
import IconGrowth from "../assets/icons/growth.svg?react";
import IconTarget from "../assets/icons/target.svg?react";

import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import styles from "../styles/pages/auth.module.scss";

const Home = () => {
  const { isConfigured, isLoading, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

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
          <p className={styles.authHint}>
            New here? We will create your account with Google.
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </motion.div>
      </div>
    </section>
  );
};

export default Home;
