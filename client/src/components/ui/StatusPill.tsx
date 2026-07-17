import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "../../styles/components/uiPrimitives.module.scss";

type StatusPillTone = "neutral" | "action" | "success" | "warning" | "danger";

type StatusPillProps = {
  children: ReactNode;
  className?: string;
  tone?: StatusPillTone;
};

const toneClasses: Record<StatusPillTone, string> = {
  action: styles.pillAction,
  danger: styles.pillDanger,
  neutral: styles.pillNeutral,
  success: styles.pillSuccess,
  warning: styles.pillWarning,
};

const StatusPill = ({
  children,
  className,
  tone = "neutral",
}: StatusPillProps) => (
  <span className={clsx(styles.pill, toneClasses[tone], className)}>
    {children}
  </span>
);

export default StatusPill;
