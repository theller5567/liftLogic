import styles from '../styles/components/pill.module.scss'
import clsx from 'clsx'

type PillProps = {
  label: string
  state?: "active" | "inactive" | "muted" | "completed",
  size?: "small" | "medium" | "large"
  className?: string
}

const Pill = ({ label, state, size, className }: PillProps) => {
    const classes = clsx(styles.pill, state && styles[`pill--${state}`], size && styles[`pill--${size}`], className)
  return (
    <span className={`pill ${classes}`}>{label}</span>
  )
}

export default Pill