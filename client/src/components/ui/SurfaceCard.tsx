import clsx from "clsx";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import styles from "../../styles/components/uiPrimitives.module.scss";

type SurfaceCardTone = "default" | "elevated" | "active" | "completed" | "warning";

type SurfaceCardProps<TElement extends ElementType = "article"> = {
  as?: TElement;
  children: ReactNode;
  className?: string;
  tone?: SurfaceCardTone;
} & Omit<ComponentPropsWithoutRef<TElement>, "as" | "children" | "className">;

const toneClasses: Record<SurfaceCardTone, string | undefined> = {
  active: styles.surfaceCardActive,
  completed: styles.surfaceCardCompleted,
  default: undefined,
  elevated: styles.surfaceCardElevated,
  warning: styles.surfaceCardWarning,
};

const SurfaceCard = <TElement extends ElementType = "article">({
  as,
  children,
  className,
  tone = "default",
  ...props
}: SurfaceCardProps<TElement>) => {
  const Component = as ?? "article";

  return (
    <Component
      className={clsx(styles.surfaceCard, toneClasses[tone], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default SurfaceCard;
