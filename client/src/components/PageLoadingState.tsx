import Button from "./Button";
import styles from "../styles/components/pageLoadingState.module.scss";

type PageLoadingStateProps = {
  actionLabel?: string;
  fullScreen?: boolean;
  message?: string;
  onAction?: () => void;
  title?: string;
  tone?: "loading" | "error";
};

const PageLoadingState = ({
  actionLabel,
  fullScreen = false,
  message,
  onAction,
  title = "Loading...",
  tone = "loading",
}: PageLoadingStateProps) => (
  <section
    className={[
      styles.loadingState,
      fullScreen ? styles.fullScreen : "",
      tone === "error" ? styles.error : "",
    ].join(" ")}
    role={tone === "error" ? "alert" : "status"}
    aria-live={tone === "error" ? "assertive" : "polite"}
  >
    {tone === "loading" ? <span className={styles.spinner} aria-hidden="true" /> : null}
    <div>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
    </div>
    {onAction ? (
      <Button
        label={actionLabel ?? "Try again"}
        size="small"
        tone={tone === "error" ? "white" : "gray"}
        variant="outline"
        onClick={onAction}
      />
    ) : null}
  </section>
);

export default PageLoadingState;
