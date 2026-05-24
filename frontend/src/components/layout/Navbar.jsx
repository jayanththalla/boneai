/**
 * Navbar — Dia Sticky Header Bar
 *
 * Background #EFEFEF (--color-fog) with backdrop-filter: blur(24px).
 * Nav links at 14px weight 400 #000000.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Button from '../ui/Button'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'For Clinicians', href: '/dashboard' },
    { label: 'Docs', href: '#' },
  ]

  return (
    <header
      className={[
        'sticky top-0 z-50',
        'bg-canvas-white/80 backdrop-blur-md border-b border-mist-gray/20',
        'px-24 py-4',
      ].join(' ')}
    >
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between h-[44px]">
        {/* Left: Wordmark + Links */}
        <div className="flex items-center gap-40">
          <Link
            to="/"
            className="flex items-center gap-2 font-medium text-body text-ink-black no-underline"
          >
            <div className="w-4 h-4 rotate-45 bg-ink-black rounded-sm" />
            BoneAI
          </Link>

          <div className="hidden md:flex items-center gap-24">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('/')) {
                    e.preventDefault()
                    navigate(link.href)
                  }
                }}
                className={[
                  'text-body-sm text-ink-black/80',
                  'no-underline hover:text-ink-black',
                  'transition-colors duration-200 ease-out',
                ].join(' ')}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: CTA */}
        {location.pathname !== '/triage' && (
          <Button
            variant="primary"
            onClick={() => navigate('/triage')}
          >
            Start Triage
          </Button>
        )}
      </nav>
    </header>
  )
}
