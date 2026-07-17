import clsx from "clsx";

import Button from "../Button";
import styles from "../../styles/components/uiPrimitives.module.scss";

type InlineStatusTone = "info" | "loading" | "success" | "error";

type InlineStatusProps = {
  actionLabel?: string;
  className?: string;
  message?: string;
  onAction?: () => void;
  title: string;
  tone?: InlineStatusTone;
};

const InlineStatus = ({
  actionLabel,
  className,
  message,
  onAction,
  title,
  tone = "info",
}: InlineStatusProps) => (
  <div
    className={clsx(
      styles.inlineStatus,
      styles[`inlineStatus-${tone}`],
      "ll-motion-fade-in",
      tone === "loading" && "ll-motion-shimmer",
      className
    )}
    role={tone === "error" ? "alert" : "status"}
    aria-live={tone === "error" ? "assertive" : "polite"}
  >
    {tone === "loading" ? (
      <div className={styles.inlineStatusLoadingCopy}>
        <span className={styles.inlineStatusSpinner} aria-hidden="true" />
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
      </div>
    ) : (
      <div>
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
      </div>
    )}
    {onAction ? (
      <Button
        label={actionLabel ?? "Try again"}
        size="small"
        tone={tone === "error" ? "white" : "gray"}
        variant="outline"
        onClick={onAction}
      />
    ) : null}
  </div>
);

export default InlineStatus;
