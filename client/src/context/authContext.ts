import { createContext } from "react";
import type { User } from "firebase/auth";

export type AuthStatus = "loading" | "authenticated" | "signed_out" | "auth_error";

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  authError: Error | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthStatus;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
