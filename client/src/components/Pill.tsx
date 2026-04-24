import styles from '../styles/components/pill.module.scss'
import clsx from 'clsx'

type PillProps = {
  copy: string
  state?: "active" | "inactive" | "muted" | "completed",
  size?: "small" | "medium" | "large"
}

const Pill = ({ copy, state, size }: PillProps) => {
    const classes = clsx(styles.pill, state && styles[`pill--${state}`], size && styles[`pill--${size}`])
  return (
    <span className={`pill ${classes}`}>{copy}</span>
  )
}

export default Pill