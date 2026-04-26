import clsx from "clsx";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { type ComponentProps, type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";

import Button from "./Button";
import styles from "../styles/components/bottomSheet.module.scss";

type BottomSheetAction = Omit<ComponentProps<typeof Button>, "type" | "onClick"> & {
  label: string;
  onClick?: () => void;
  closeOnClick?: boolean;
};

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  description?: string;
  variant?: "half" | "full";
  actions?: BottomSheetAction[];
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  showHandle?: boolean;
  className?: string;
};

const BottomSheet = ({
  open,
  onClose,
  children,
  title,
  eyebrow,
  description,
  variant = "half",
  actions,
  closeOnOverlayClick = true,
  showCloseButton = true,
  showHandle = true,
  className,
}: BottomSheetProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleActionClick = (action: BottomSheetAction) => {
    action.onClick?.();

    if (action.closeOnClick !== false) {
      onClose();
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.viewport}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close bottom sheet"
            className={styles.backdrop}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            className={clsx(styles.sheet, styles[`sheet--${variant}`], className)}
            onClick={(event) => event.stopPropagation()}
            initial={{ y: prefersReducedMotion ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: prefersReducedMotion ? 0 : "100%" }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 34,
              mass: 0.9,
            }}
          >
            {showHandle ? <span aria-hidden="true" className={styles.handle} /> : null}

            {(eyebrow || title || description || showCloseButton) ? (
              <header className={styles.header}>
                <div className={styles.headerCopy}>
                  {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
                  {title ? (
                    <h2 id={titleId} className={styles.title}>
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p id={descriptionId} className={styles.description}>
                      {description}
                    </p>
                  ) : null}
                </div>
                {showCloseButton ? (
                  <button
                    type="button"
                    className={styles.closeButton}
                    aria-label="Close bottom sheet"
                    onClick={onClose}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                ) : null}
              </header>
            ) : null}

            <div className={styles.content}>{children}</div>

            {actions?.length ? (
              <footer className={styles.actions}>
                {actions.map((action, index) => (
                  <Button
                    key={action.label + index}
                    {...action}
                    type="button"
                    onClick={() => handleActionClick(action)}
                  />
                ))}
              </footer>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default BottomSheet;
