import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import BottomSheet from "../BottomSheet";
import BottomNavigation from "./BottomNavigation";
import Avatar from "./Avatar";
import styles from "../../styles/components/appShell.module.scss";

type AppShellProps = {
  children: ReactNode;
  displayName?: string;
};

const AppShell = ({ children, displayName }: AppShellProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const resolvedDisplayName = displayName ?? user?.displayName ?? undefined;
  const accountName = resolvedDisplayName ?? "LiftLogic user";
  const accountEmail = user?.email ?? "Signed in with Google";

  const getFirstName = (displayName?: string) =>
    displayName?.split(" ").filter(Boolean)[0] ?? "there";

  const openSettings = () => {
    setAccountSheetOpen(false);
    navigate("/settings");
  };

  const handleSignOut = () => {
    setAccountSheetOpen(false);
    void signOut().then(() => {
      navigate("/login", { replace: true });
    });
  };

  return (
    <div className={styles.appShell}>
      <header className={styles.appHeader}>
        <div className={styles.appBrand}>
          <Link to="/dashboard"><span>Lift</span>Logic</Link>
        </div>
        <div className={styles.appHeaderRight}>
          <div className={styles.profileSummary}>
            <p>Welcome back,</p>
            <strong>{getFirstName(resolvedDisplayName)}</strong>
          </div>

            <Avatar
                ariaLabel="Open account menu"
                name={resolvedDisplayName}
                onClick={() => setAccountSheetOpen(true)}
                photoUrl={user?.photoURL ?? undefined}
              />
          </div>
      </header>
      <div id="app-scroll-content" className={styles.appContent}>
        {children}
      </div>
      <BottomNavigation />
      <BottomSheet
        open={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        eyebrow="Account"
        title={accountName}
        description={accountEmail}
        actions={[
          {
            label: "Settings",
            tone: "primary",
            icon: "settings",
            iconSize: "large",
            onClick: openSettings,
          },
          {
            label: "Sign out",
            tone: "white",
            variant: "outline",
            icon: "exit",
            iconSize: "large",
            onClick: handleSignOut,
          },
        ]}
      >
        <div className={styles.accountSheetProfile}>
          <Avatar
            ariaLabel={`${accountName} avatar`}
            name={resolvedDisplayName}
            photoUrl={user?.photoURL ?? undefined}
          />
          <div>
            <strong>{accountName}</strong>
            <span>{accountEmail}</span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default AppShell;
