import { useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const STEPS = [
  {
    step: 1,
    title: 'Describe symptoms',
    description:
      'Tell us about your injury in any language. Our NLP engine extracts clinical signals from natural language — Hindi, English, or any Indian language.',
  },
  {
    step: 2,
    title: 'Upload X-ray',
    description:
      'If flagged as high risk, upload an X-ray image. Our EfficientNet-B4 model analyses it with CLAHE enhancement and MC-Dropout uncertainty estimation.',
  },
  {
    step: 3,
    title: 'Receive severity report',
    description:
      'Get an instant severity report with fracture probability, Grad-CAM visual explanation, and a clear referral decision — all in under 3 minutes.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden bg-canvas-white min-h-screen">
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 relative z-10">
        <div className="max-w-[1000px] mx-auto text-center flex flex-col items-center">
          {/* Subtitle */}
          <p className="text-body-lg font-inter text-mist-gray mb-6">
            Clinical-grade triage in under 3 minutes
          </p>

          {/* Display heading */}
          <h1 className="font-bricolagegrotesque text-display font-semibold text-midnight-ink mb-10 max-w-[800px]">
            Is it a sprain or a fracture?
          </h1>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 mb-24">
            <Button variant="primary" onClick={() => navigate('/triage')}>
              Begin Triage
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              How it works
            </Button>
          </div>

          {/* Mockup with Gradient Glow */}
          <div className="relative w-full max-w-[900px] mt-10">
            {/* Ambient Gradient Glow */}
            <div className="absolute inset-0 gradient-violet-sparkle opacity-60 z-0 pointer-events-none" />
            
            {/* Product UI Mockup */}
            <div className="relative z-10 bg-canvas-white border border-mist-gray rounded-images shadow-subtle overflow-hidden aspect-video flex flex-col">
              {/* Mockup Header */}
              <div className="h-10 bg-pale-cloud flex items-center px-4 gap-2 border-b border-mist-gray">
                <div className="w-3 h-3 rounded-full bg-mist-gray/40" />
                <div className="w-3 h-3 rounded-full bg-mist-gray/40" />
                <div className="w-3 h-3 rounded-full bg-mist-gray/40" />
              </div>
              {/* Mockup Content */}
              <div className="flex-1 flex overflow-hidden">
                <img src="/images/diagnostic_interface.png" alt="Diagnostic Interface Mockup" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works Section ──────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="pt-24 pb-32 px-6 relative z-10 bg-pale-cloud"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center">
          <h2 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-20 text-center">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {STEPS.map((s) => (
              <Card key={s.step} variant="feature" className="flex flex-col text-left">
                <Badge variant="accent" className="w-fit mb-6">
                  Step {s.step}
                </Badge>
                <h3 className="font-bricolagegrotesque text-heading font-semibold text-midnight-ink mb-4">
                  {s.title}
                </h3>
                <p className="font-inter text-body text-ghost-gray">
                  {s.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* ── Privacy/Trust Section ─────────────────────────────────────────── */}
      <section className="pt-24 pb-32 px-6 relative z-10 bg-canvas-white">
        <div className="max-w-[600px] mx-auto text-center">
          <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-mint-glaze rounded-full text-midnight-ink">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-6">
            Privacy first. Always.
          </h2>
          <p className="font-inter text-body-lg text-ghost-gray mb-8">
            Your medical data never leaves the edge unnecessarily. We process natural language completely anonymously and analyze X-rays using decentralized inference.
          </p>
          <a href="#" className="font-inter text-body text-royal-amethyst font-semibold hover:text-deep-plum transition-colors duration-200">
            Learn more about privacy in BoneAI →
          </a>
        </div>
      </section>
    </div>
  )
}
