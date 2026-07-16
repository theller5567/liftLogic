import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { authError, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Checking session..." />;
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
