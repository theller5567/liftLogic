import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import styles from "../../styles/components/uiPrimitives.module.scss";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  error?: string;
  helper?: string;
  label: string;
};

const controlClassName = styles.fieldControl;

const FormField = ({ children, className, error, helper, label }: FormFieldProps) => (
  <label className={clsx(styles.formField, className)}>
    <span className={styles.fieldLabel}>{label}</span>
    {children}
    {helper ? <p className={styles.fieldHelper}>{helper}</p> : null}
    {error ? (
      <p className={clsx(styles.fieldHelper, styles.fieldError)}>{error}</p>
    ) : null}
  </label>
);

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={clsx(controlClassName, props.className)} />
);

export const SelectInput = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={clsx(controlClassName, props.className)} />
);

export default FormField;
