import type { ReactNode } from "react";

import BottomNavigation from "./BottomNavigation";
import styles from "../../styles/components/appShell.module.scss";

type AppShellProps = {
  children: ReactNode;
};

const AppShell = ({ children }: AppShellProps) => (
  <div className={styles.appShell}>
    <div className={styles.appContent}>{children}</div>
    <BottomNavigation />
  </div>
);

export default AppShell;
