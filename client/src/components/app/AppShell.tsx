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
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const resolvedDisplayName = displayName ?? user?.displayName ?? undefined;
  const accountName = resolvedDisplayName ?? "LiftLogic user";
  const accountEmail = user?.email ?? "Signed in with Google";

  const getFirstName = (displayName?: string) =>
    displayName?.split(" ").filter(Boolean)[0] ?? "there";

  const openSettings = () => {
    setAccountSheetOpen(false);
    navigate("/settings");
  };

  const requestSignOut = () => {
    setAccountSheetOpen(false);
    setSignOutConfirmOpen(true);
  };

  const handleSignOut = () => {
    setSignOutConfirmOpen(false);
    void signOut().then(() => {
      navigate("/", { replace: true });
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
            onClick: requestSignOut,
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
      <BottomSheet
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        eyebrow="Sign Out"
        title="Sign out of LiftLogic?"
        description="You can sign back in with Google whenever you are ready."
        actions={[
          {
            label: "Cancel",
            tone: "white",
            variant: "outline",
          },
          {
            label: "Sign out",
            tone: "danger",
            variant: "outline",
            icon: "exit",
            onClick: handleSignOut,
          },
        ]}
      >
        <p className={styles.accountSheetWarning}>
          Any unsaved changes may be lost before you leave this session.
        </p>
      </BottomSheet>
    </div>
  );
};

export default AppShell;
