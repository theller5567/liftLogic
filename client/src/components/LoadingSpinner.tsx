import styles from "../styles/components/loadingSpinner.module.scss";

type LoadingSpinnerProps = {
  label?: string;
  fullScreen?: boolean;
};

const LoadingSpinner = ({
  label = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) => (
  <div className={fullScreen ? styles.fullScreen : styles.inline} role="status">
    <span className={styles.spinner} aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default LoadingSpinner;
