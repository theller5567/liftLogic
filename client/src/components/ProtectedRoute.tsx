import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../context/useAuth";
import PageLoadingState from "./PageLoadingState";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { authError, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageLoadingState
        fullScreen
        title="Checking your session"
        message="This only takes a moment."
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: authError
            ? "Your session expired. Please sign in again."
            : undefined,
        }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
