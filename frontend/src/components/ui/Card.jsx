/**
 * Card — Supahub Design System
 */
export default function Card({
  children,
  variant = 'feature',
  className = '',
  ...props
}) {
  const base = 'overflow-hidden transition-all duration-200 break-inside-avoid'
  
  const variants = {
    feature: 'bg-canvas-white rounded-cards p-8 shadow-none',
    accent: 'bg-muted-amethyst rounded-cards p-0 shadow-none',
    testimonial: 'bg-canvas-white border border-mist-gray rounded-cards p-8 shadow-none',
  }

  return (
    <div
      className={`${base} ${variants[variant] || variants.feature} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
