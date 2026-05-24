/**
 * Spinner — Animated ring spinner.
 *
 * deep-black stroke, CSS animation.
 */
export default function Spinner({ size = 48, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="var(--color-subtle-ash)"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M24 4a20 20 0 0 1 20 20"
          stroke="var(--color-deep-black)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
