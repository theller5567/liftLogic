import styles from "../../styles/components/dashboard.module.scss";

type DashboardHeaderProps = {
  displayName?: string;
};

const getFirstName = (displayName?: string) =>
  displayName?.split(" ").filter(Boolean)[0] ?? "there";

const DashboardHeader = ({ displayName }: DashboardHeaderProps) => (
  <header className={styles.dashboardHeader}>
    <div className={styles.profileSummary}>
      <p>Welcome back,</p>
      <strong>{getFirstName(displayName)}</strong>
    </div>
  </header>
);

export default DashboardHeader;
