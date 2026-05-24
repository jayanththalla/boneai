/**
 * Badge — Supahub Design System
 */
export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) {
  const base = [
    'inline-flex items-center justify-center',
    'rounded-badges',
    'px-2 py-1',
    'font-inter text-caption',
    'font-medium whitespace-nowrap',
  ].join(' ')

  const variants = {
    neutral: 'bg-pale-cloud text-midnight-ink',
    success: 'bg-mint-glaze text-midnight-ink',
    danger: 'bg-rose-bloom text-canvas-white',
    accent: 'bg-royal-amethyst text-canvas-white',
    inverse: 'bg-midnight-ink text-canvas-white',
  }

  return (
    <span
      className={`${base} ${variants[variant] || variants.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
