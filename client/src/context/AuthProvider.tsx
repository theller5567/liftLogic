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

import { AuthContext, type AuthContextValue } from "./authContext";
import {
  firebaseAuth,
  googleAuthProvider,
  isFirebaseConfigured,
} from "../services/firebase";
import { setAuthTokenProvider } from "../services/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(firebaseAuth));
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseAuth) {
      setAuthTokenProvider(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setAuthTokenProvider(nextUser ? () => nextUser.getIdToken() : null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseAuth) {
      throw new Error("Firebase is not configured.");
    }

    await signInWithPopup(firebaseAuth, googleAuthProvider);
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseAuth) {
      return;
    }

    await firebaseSignOut(firebaseAuth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isConfigured,
      signInWithGoogle,
      signOut,
    }),
    [isConfigured, isLoading, signInWithGoogle, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
