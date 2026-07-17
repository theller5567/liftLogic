import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import { AuthContext, type AuthContextValue, type AuthStatus } from "./authContext";
import {
  firebaseAuth,
  googleAuthProvider,
  isFirebaseConfigured,
} from "../services/firebase";
import { setAuthExpiredHandler, setAuthTokenProvider } from "../services/api";
import {
  clearCachedCurrentAppData,
  setCurrentAppDataCacheScope,
} from "../utils/appDataCache";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(firebaseAuth));
  const [authError, setAuthError] = useState<Error | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    firebaseAuth ? "loading" : "signed_out"
  );
  const isConfigured = isFirebaseConfigured();

  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setStatus((currentStatus) =>
      currentStatus === "auth_error" ? "signed_out" : currentStatus
    );
  }, []);

  const signOut = useCallback(async () => {
    clearCachedCurrentAppData({
      clearAllScopes: true,
      clearWorkoutState: true,
    });
    setCurrentAppDataCacheScope(null);

    if (!firebaseAuth) {
      setUser(null);
      setAuthTokenProvider(null);
      setStatus("signed_out");
      return;
    }

    await firebaseSignOut(firebaseAuth);
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setAuthTokenProvider(null);
      setAuthExpiredHandler(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setCurrentAppDataCacheScope(nextUser?.uid ?? null);
      setUser(nextUser);
      setAuthTokenProvider(nextUser ? () => nextUser.getIdToken() : null);
      setIsLoading(false);
      setStatus(nextUser ? "authenticated" : "signed_out");
    });

    setAuthExpiredHandler(async (error) => {
      setAuthError(error);
      setStatus("auth_error");
      setAuthTokenProvider(null);
      await signOut();
    });

    return () => {
      unsubscribe();
      setAuthExpiredHandler(null);
    };
  }, [signOut]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured.");
    }

    clearAuthError();
    setIsLoading(true);
    setStatus("loading");

    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
    } catch (error) {
      setIsLoading(false);
      setStatus("signed_out");
      throw error;
    }
  }, [clearAuthError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authError,
      clearAuthError,
      isLoading,
      isConfigured,
      signInWithGoogle,
      signOut,
      status,
    }),
    [
      authError,
      clearAuthError,
      isConfigured,
      isLoading,
      signInWithGoogle,
      signOut,
      status,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
