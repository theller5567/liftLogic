import Avatar from "../app/Avatar";
import styles from "../../styles/components/dashboard.module.scss";

type DashboardHeaderProps = {
  displayName?: string;
  photoUrl?: string;
};

const getFirstName = (displayName?: string) =>
  displayName?.split(" ").filter(Boolean)[0] ?? "there";

const DashboardHeader = ({ displayName, photoUrl }: DashboardHeaderProps) => (
  <header className={styles.dashboardHeader}>
    <div className={styles.brand}>
      <span>Lift</span>Logic
    </div>
    <div className={styles.profileSummary}>
      <p>Welcome back,</p>
      <strong>{getFirstName(displayName)}</strong>
      <Avatar name={displayName} photoUrl={photoUrl} linkToSettings={true} />
    </div>
  </header>
);

export default DashboardHeader;
