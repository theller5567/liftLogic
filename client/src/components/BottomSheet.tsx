import clsx from "clsx";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { type ComponentProps, type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import Button from "./Button";
import styles from "../styles/components/bottomSheet.module.scss";
import {
  getDuration,
  motionDurations,
  sheetSpringTransition,
} from "../utils/motion";

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
  const sheetRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      sheetRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const handleActionClick = (action: BottomSheetAction) => {
    action.onClick?.();

    if (action.closeOnClick !== false) {
      onClose();
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  const overlayTransition = {
    duration: getDuration(motionDurations.standard, prefersReducedMotion),
  };
  const sheetTransition = prefersReducedMotion
    ? { duration: 0 }
    : sheetSpringTransition;
  const contentTransition = {
    duration: getDuration(motionDurations.standard, prefersReducedMotion),
    delay: prefersReducedMotion ? 0 : 0.07,
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          className={styles.viewport}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
        >
          <button
            type="button"
            aria-label="Close bottom sheet"
            className={styles.backdrop}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          <motion.section
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={clsx(styles.sheet, styles[`sheet--${variant}`], className)}
            onClick={(event) => event.stopPropagation()}
            initial={{
              opacity: prefersReducedMotion ? 1 : 0,
              scale: prefersReducedMotion ? 1 : 0.98,
              y: prefersReducedMotion ? 0 : "100%",
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: prefersReducedMotion ? 1 : 0,
              scale: prefersReducedMotion ? 1 : 0.98,
              y: prefersReducedMotion ? 0 : "100%",
            }}
            transition={sheetTransition}
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

            <motion.div
              className={styles.content}
              initial={{
                opacity: prefersReducedMotion ? 1 : 0,
                y: prefersReducedMotion ? 0 : 8,
              }}
              animate={{ opacity: 1, y: 0 }}
              transition={contentTransition}
            >
              {children}
            </motion.div>

            {actions?.length ? (
              <motion.footer
                className={styles.actions}
                initial={{
                  opacity: prefersReducedMotion ? 1 : 0,
                  y: prefersReducedMotion ? 0 : 10,
                }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...contentTransition,
                  delay: prefersReducedMotion ? 0 : 0.1,
                }}
              >
                {actions.map((action, index) => (
                  <Button
                    key={action.label + index}
                    {...action}
                    type="button"
                    onClick={() => handleActionClick(action)}
                  />
                ))}
              </motion.footer>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default BottomSheet;
