import styles from '../styles/components/pill.module.scss'
import clsx from 'clsx'
import type { CSSProperties } from 'react'

type PillProps = {
  className?: string
  label: string
  state?: "active" | "inactive" | "muted" | "completed"
  size?: "small" | "medium" | "large"
  style?: CSSProperties
  tone?: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "dark"
}

const Pill = ({ className, label, state, size, style, tone }: PillProps) => {
    const classes = clsx(styles.pill, state && styles[`pill--${state}`], size && styles[`pill--${size}`], tone && styles[`pill--${tone}`], className)
  return (
    <span className={`pill ${classes}`} style={style}>{label}</span>
  )
}

export default Pill
