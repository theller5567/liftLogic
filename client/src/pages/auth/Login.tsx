import { useState } from "react";
import { useLocation } from "react-router-dom";

import Button from "../../components/Button";
import { useAuth } from "../../context/useAuth";
import styles from "../../styles/pages/auth.module.scss";

const Login = () => {
  const location = useLocation();
  const { clearAuthError, isConfigured, isLoading, signInWithGoogle } = useAuth();
  const locationState = location.state as { message?: string } | null;
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    clearAuthError();

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
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Welcome back</p>
          <h1 className={styles.title}>Log in to LiftLogic.</h1>
          <p className={styles.body}>
            Use your Google account to continue your program setup.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            label="Continue with Google"
            tone="primary"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />
          {locationState?.message ? (
            <p className={styles.authHint}>{locationState.message}</p>
          ) : null}
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
      </div>
    </section>
  );
};

export default Login;
