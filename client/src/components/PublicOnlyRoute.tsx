import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import LoadingSpinner from "./LoadingSpinner";
import PageLoadingState from "./PageLoadingState";
import { useAuth } from "../context/useAuth";
import { isAuthSessionExpiredError } from "../services/api";
import { useUserFlow } from "../utils/userFlow";

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { isLoading: isAuthLoading, user } = useAuth();
  const {
    destination,
    error,
    isLoading: isFlowLoading,
    refresh,
  } = useUserFlow(Boolean(user));

  if (isAuthLoading || (user && isFlowLoading)) {
    return <LoadingSpinner fullScreen label="Loading account..." />;
  }

  if (user && error && !isAuthSessionExpiredError(error)) {
    return (
      <PageLoadingState
        fullScreen
        tone="error"
        title="We could not load your account"
        message="Your sign-in worked, but your profile data did not finish loading."
        onAction={refresh}
      />
    );
  }

  if (user && destination) {
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
