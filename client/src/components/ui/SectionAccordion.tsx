import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import SurfaceCard from "./SurfaceCard";
import styles from "../../styles/components/uiPrimitives.module.scss";

type SectionAccordionProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  icon: ReactNode;
  id?: string;
  title: string;
};

const SectionAccordion = ({
  children,
  defaultOpen = false,
  icon,
  id,
  title,
}: SectionAccordionProps) => (
  <SurfaceCard
    as="details"
    className={styles.accordion}
    id={id}
    open={defaultOpen}
  >
    <summary className={styles.accordionSummary}>
      <span className={styles.accordionTitle}>
        {icon}
        <h2>{title}</h2>
      </span>
      <ChevronDown className={styles.accordionIcon} aria-hidden="true" size={18} />
    </summary>
    <div className={styles.accordionContent}>{children}</div>
  </SurfaceCard>
);

export default SectionAccordion;
