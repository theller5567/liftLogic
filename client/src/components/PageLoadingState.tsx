import Button from "./Button";
import styles from "../styles/components/pageLoadingState.module.scss";

type PageLoadingStateProps = {
  actionLabel?: string;
  fullScreen?: boolean;
  message?: string;
  onAction?: () => void;
  title?: string;
  tone?: "status" | "error";
};

const PageLoadingState = ({
  actionLabel,
  fullScreen = false,
  message,
  onAction,
  title = "Something needs attention",
  tone = "status",
}: PageLoadingStateProps) => (
  <section
    className={[
      styles.loadingState,
      fullScreen ? styles.fullScreen : "",
      tone === "error" ? styles.error : "",
      "ll-motion-slide-up",
    ].join(" ")}
    role={tone === "error" ? "alert" : "status"}
    aria-live={tone === "error" ? "assertive" : "polite"}
  >
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
