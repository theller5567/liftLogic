import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const Logout = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    void signOut();
  }, [signOut]);

  return <Navigate to="/" replace />;
};

export default Logout;
