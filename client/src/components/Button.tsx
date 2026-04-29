import clsx from 'clsx'
import type { ButtonHTMLAttributes, ComponentType, SVGProps } from 'react'
import IconChevronLeft from '../assets/icons/chevron-left.svg?react'
import IconRefresh from '../assets/icons/refresh.svg?react'
import IconEdit from '../assets/icons/edit.svg?react'
import IconPlus from '../assets/icons/plus-c.svg?react'
import IconMinus from '../assets/icons/minus-c.svg?react'
import IconGoogle from '../assets/icons/google.svg?react'

import styles from '../styles/components/button.module.scss'

type ButtonTone = 'primary' | 'white' | 'gray' | 'black' | 'secondary'
type ButtonVariant = 'outline' | 'ghost' | 'iconOnly'
type ButtonSize = 'small' | 'medium' | 'large'
type ButtonIconPosition = 'left' | 'right'
type ButtonIcon = 'chevronLeft' | 'refresh' | 'edit' | 'plus' | 'minus' | 'google'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string
  tone?: ButtonTone
  variant?: ButtonVariant
  rounded?: boolean
  disabled?: boolean
  size?: ButtonSize
  icon?: ButtonIcon
  iconPosition?: ButtonIconPosition
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  ariaLabel?: string
}

const ICONS: Record<ButtonIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  chevronLeft: IconChevronLeft,
  refresh: IconRefresh,
  edit: IconEdit,
  plus: IconPlus,
  minus: IconMinus,
  google: IconGoogle,
}

const Button = ({
  label,
  tone = 'primary',
  variant,
  rounded,
  size = 'medium',
  icon,
  iconPosition = 'left',
  className,
  disabled,
  type = 'button',
  ariaLabel,
  ...props
}: ButtonProps) => {
  const variantClass = variant ? styles[`button--${variant}`] : styles['button--solid']
  const roundedVariantClass = rounded ? styles['button--rounded'] : ''
  const iconClass = icon ? styles['button--with-icon'] : ''
  const iconOnlyClass = icon && !label ? styles['button--icon-only'] : ''
  const classes = clsx(
    styles.button,
    iconClass,
    iconOnlyClass,
    styles[`button--${tone}`],
    variantClass,
    roundedVariantClass,
    styles[`button--${size}`],
    className,
  )

  const IconComponent = icon ? ICONS[icon] : null
  const iconMarkup = IconComponent ? (
    <span aria-hidden="true" className={styles.iconWrapper}>
      <IconComponent className={styles.icon} />
    </span>
  ) : null

  return (
    <button
      aria-label={ariaLabel}
      className={classes}
      disabled={disabled}
      type={type}
      {...props}
    >
      {iconPosition === 'left' ? iconMarkup : null}
      {label && <span className={styles.label}>{label}</span>}
      {iconPosition === 'right' ? iconMarkup : null}
    </button>
  )
}

export default Button
