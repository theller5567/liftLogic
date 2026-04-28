import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import IconPlus from '../assets/icons/plus-c.svg?react'
import IconMinus from '../assets/icons/minus-c.svg?react'
import styles from '../styles/components/stepButton.module.scss'

type StepButtonAction = 'increment' | 'decrement'
type StepButtonSize = 'small' | 'medium' | 'large'

type StepButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> & {
    type: StepButtonAction
    size?: StepButtonSize
}

const StepButton = ({
  type,
  size = 'medium',
  className,
  'aria-label': ariaLabel,
  ...props
}: StepButtonProps) => {
  const Icon = type === 'increment' ? IconPlus : IconMinus
  const classes = clsx(
    'stepButton',
    styles[`${size}Button`],
    className,
    styles.stepButton,
  )

  return (
    <button
      type="button"
      className={classes}
      aria-label={
        ariaLabel ??
        (type === 'increment' ? 'Increase starting weight' : 'Decrease starting weight')
      }
      {...props}
    >
      <Icon aria-hidden="true" />
    </button>
  )
}

export default StepButton
