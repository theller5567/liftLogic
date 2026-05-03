import styles from '../styles/components/pill.module.scss'
import clsx from 'clsx'

type PillProps = {
  className?: string
  label: string
  state?: "active" | "inactive" | "muted" | "completed"
  size?: "small" | "medium" | "large"
  style?: string,
  tone?: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "dark"
  key?: string | number
}

const Pill = ({ className, label, state, size, style, key, tone }: PillProps) => {
    const classes = clsx(styles.pill, state && styles[`pill--${state}`], size && styles[`pill--${size}`], tone && styles[`pill--${tone}`], style, className)
  return (
    <span className={`pill ${classes}`} key={key}>{label}</span>
  )
}

export default Pill
