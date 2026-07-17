import type { ReactNode } from "react";
import {Link} from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import BottomNavigation from "./BottomNavigation";
import Avatar from "./Avatar";
import styles from "../../styles/components/appShell.module.scss";

type AppShellProps = {
  children: ReactNode;
  displayName?: string;
};

const AppShell = ({ children, displayName }: AppShellProps) => {
  const { user } = useAuth();
  const resolvedDisplayName = displayName ?? user?.displayName ?? undefined;

  const getFirstName = (displayName?: string) =>
    displayName?.split(" ").filter(Boolean)[0] ?? "there";

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
                ariaLabel="Open settings"
                name={resolvedDisplayName}
                photoUrl={user?.photoURL ?? undefined}
                linkToSettings
              />
          </div>
      </header>
      <div id="app-scroll-content" className={styles.appContent}>
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default AppShell;
