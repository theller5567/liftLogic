import '../App.css'
import Button from '../components/Button'
import pageStyles from '../styles/pages/page.module.scss'

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
        <section className={`${pageStyles.shell} flex flex-column flex-start gap-4`}>
          <h2>Buttons</h2>
          <div className="flex gap-5">
            {buttonGroups.map((group) => (
              <div
                key={group.tone}
                className="flex flex-column flex-start gap-4"
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
        </section>
      )
}

export default Design
