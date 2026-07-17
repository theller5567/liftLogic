import type { ComponentType, SVGProps } from "react";

import SurfaceCard from "./SurfaceCard";
import styles from "../../styles/components/uiPrimitives.module.scss";

type StatCardProps = {
  detail?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
};

const StatCard = ({ detail, icon: Icon, label, value }: StatCardProps) => (
  <SurfaceCard className={styles.statCard}>
    <Icon className={styles.statIcon} aria-hidden="true" />
    <div>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {detail ? <span className={styles.statHelper}>{detail}</span> : null}
    </div>
  </SurfaceCard>
);

export default StatCard;
