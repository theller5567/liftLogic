import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const Logout = () => {
  const navigate = useNavigate();
  const { clearAuthError, signOut } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const completeSignOut = async () => {
      clearAuthError();
      await signOut();

      if (isMounted) {
        navigate("/", { replace: true });
      }
    };

    void completeSignOut();

    return () => {
      isMounted = false;
    };
  }, [clearAuthError, navigate, signOut]);

  return <p className="text-muted">Signing out...</p>;
};

export default Logout;
