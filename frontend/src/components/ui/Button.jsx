/**
 * Button — Supahub Design System
 */
export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  fullWidth = false,
  ...props
}) {
  const base = [
    'inline-flex items-center justify-center',
    'font-inter font-medium text-body',
    'transition-all duration-200 ease-out',
    'cursor-pointer select-none',
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-[1px]',
    fullWidth ? 'w-full' : '',
  ].join(' ')

  const variants = {
    primary: [
      'bg-royal-amethyst text-canvas-white',
      'rounded-buttons',
      'px-6 py-3',
    ].join(' '),
    secondary: [
      'bg-canvas-white text-midnight-ink',
      'border border-mist-gray',
      'rounded-buttons',
      'px-6 py-3',
      'hover:bg-pale-cloud',
    ].join(' '),
    ghost: [
      'bg-transparent text-mist-gray',
      'rounded-full',
      'px-2 py-2',
      'hover:bg-pale-cloud hover:text-midnight-ink',
    ].join(' '),
  }

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
