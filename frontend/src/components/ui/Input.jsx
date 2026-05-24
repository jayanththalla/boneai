/**
 * Input — Supahub Design System
 */
import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    as = 'input',
    className = '',
    ...props
  },
  ref
) {
  const Component = as === 'textarea' ? 'textarea' : 'input'

  const baseClasses = [
    'w-full',
    'border border-midnight-ink',
    'rounded-inputs',
    'px-4 py-3',
    'font-inter',
    'text-body',
    'text-midnight-ink',
    'bg-canvas-white',
    'placeholder:text-mist-gray',
    'outline-none',
    'focus:border-royal-amethyst',
    'transition-colors duration-150',
    as === 'textarea' ? 'resize-y min-h-[120px]' : '',
    className,
  ].join(' ')

  return (
    <Component
      ref={ref}
      className={baseClasses}
      {...props}
    />
  )
})

export default Input
