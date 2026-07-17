import type { ReactNode } from "react";

import styles from "../../styles/components/uiPrimitives.module.scss";

type PageHeaderProps = {
  action?: ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
};

const PageHeader = ({ action, description, eyebrow, title }: PageHeaderProps) => (
  <header className={styles.pageHeader}>
    <div className={styles.pageHeaderContent}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {description ? <span className={styles.description}>{description}</span> : null}
    </div>
    {action ? <div className={styles.pageHeaderAction}>{action}</div> : null}
  </header>
);

export default PageHeader;
