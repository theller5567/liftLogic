import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { authError, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p className="text-muted">Loading...</p>;
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
