import type { CSSProperties } from 'react'

import '../App.css'
import Button from '../components/Button'

type ButtonPreview = {
  variant?: 'outline' | 'ghost'
  icon?: 'chevronLeft'
  iconPosition?: 'left' | 'right'
  rounded?: boolean
  size: 'small' | 'medium' | 'large'
  disabled?: boolean
}

type ButtonGroup = {
  tone: 'primary' | 'white' | 'gray' | 'black' | 'secondary'
  variants: ButtonPreview[]
}
const Design = () => {
    const buttonGroups: ButtonGroup[] = [
        {
          tone: 'primary' as const,
          variants: [
            { icon: 'chevronLeft', size: 'large' as const },
            { size: 'medium' as const },
            { size: 'small' as const },
            { variant: 'outline' as const, size: 'large' as const },
            { variant: 'outline' as const, size: 'medium' as const },
            { variant: 'outline' as const, size: 'medium' as const, rounded: true },
          ],
        },
        {
          tone: 'white' as const,
          variants: [
            { icon: 'chevronLeft', iconPosition: 'right', size: 'large' as const },
            {size: 'medium' as const },
            {size: 'small' as const },
            { variant: 'outline' as const, size: 'large' as const },
            { variant: 'outline' as const, size: 'medium' as const },
            { variant: 'outline' as const, size: 'medium' as const, rounded: true },
          ],
        },
        {
          tone: 'gray' as const,
          variants: [
            {size: 'large' as const, disabled: true },
            {size: 'medium' as const, disabled: true },
            {size: 'small' as const, disabled: true },
            { variant: 'outline' as const, size: 'large' as const, disabled: true },
            { variant: 'outline' as const, size: 'medium' as const, disabled: true },
            { variant: 'outline' as const, size: 'medium' as const, disabled: true, rounded: true },
          ],
        },
        {
          tone: 'black' as const,
          variants: [
            {size: 'large' as const },
            {size: 'medium' as const },
            {size: 'small' as const },
            { variant: 'ghost' as const, size: 'large' as const },
            { variant: 'ghost' as const, size: 'medium' as const },
            { variant: 'ghost' as const, size: 'medium' as const, rounded: true },
          ],
        },
        {
          tone: 'secondary' as const,
          variants: [
            {size: 'large' as const },
            {size: 'medium' as const },
            {size: 'small' as const },
            { variant: 'outline' as const, size: 'large' as const },
            { variant: 'outline' as const, size: 'medium' as const },
            { variant: 'outline' as const, size: 'medium' as const, rounded: true },
          ],
        },
      ]
    
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            padding: '2rem',
            gap: '1rem',
            background: 'hsl(var(--clr-neutral-800-b))',
          }}
        >
          <h2>Buttons</h2>
          <div className="flex" style={{ '--gap': '1.25rem' } as CSSProperties}>
            {buttonGroups.map((group) => (
              <div
                key={group.tone}
                className="flex flex-column flex-start"
                style={{ '--gap': '1rem' } as CSSProperties}
              >
                {group.variants.map(({ variant, size, disabled, rounded, icon, iconPosition }) => (
                  <Button
                    key={`${group.tone}-${variant ?? 'solid'}-${size}-${rounded ? 'rounded' : 'default'}`}
                    label="Log set"
                    tone={group.tone}
                    variant={variant}
                    rounded={rounded}
                    size={size}
                    disabled={disabled}
                    icon={icon}
                    iconPosition={iconPosition}
                  />
                ))}
              </div>
            ))}
          </div>
        </main>
      )
}

export default Design
