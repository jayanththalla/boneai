import { useLocation, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

/**
 * Semicircle gauge SVG component for fracture probability.
 */
function ProbabilityGauge({ value = 0 }) {
  const percentage = Math.round(value * 100)
  // Semicircle arc: r=60, circumference of semicircle = π * r ≈ 188.5
  const radius = 60
  const circumference = Math.PI * radius
  const offset = circumference - (value * circumference)

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Background arc */}
        <path
          d="M 10 80 A 60 60 0 0 1 150 80"
          fill="none"
          stroke="#d8e0ea"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 80 A 60 60 0 0 1 150 80"
          fill="none"
          stroke={value >= 0.5 ? '#e22ba4' : '#862fe7'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
        {/* Center text */}
        <text
          x="80"
          y="75"
          textAnchor="middle"
          fill="#111827"
          fontSize="24"
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          {percentage}%
        </text>
      </svg>
    </div>
  )
}

/**
 * Get verdict display config from result data.
 */
function getVerdict(symptomResult, xrayResult) {
  if (xrayResult) {
    switch (xrayResult.status) {
      case 'fracture':
        return { label: 'FRACTURE DETECTED', variant: 'danger', color: '#e22ba4' }
      case 'no_fracture':
        return { label: 'NO FRACTURE', variant: 'success', color: '#862fe7' }
      case 'radiologist_queue':
        return { label: 'RADIOLOGIST REVIEW', variant: 'neutral', color: '#3f4654' }
      case 'retake':
        return { label: 'RETAKE REQUIRED', variant: 'danger', color: '#e22ba4' }
      default:
        return { label: 'UNKNOWN', variant: 'neutral', color: '#3f4654' }
    }
  }

  // No X-ray — symptom-only result
  switch (symptomResult?.severity) {
    case 'low':
      return { label: 'LOW RISK — LIKELY SPRAIN', variant: 'success', color: '#862fe7' }
    case 'medium':
      return { label: 'MODERATE RISK', variant: 'neutral', color: '#3f4654' }
    case 'high':
      return { label: 'HIGH RISK', variant: 'danger', color: '#e22ba4' }
    default:
      return { label: 'ASSESSMENT COMPLETE', variant: 'neutral', color: '#3f4654' }
  }
}

function getUncertaintyLabel(uncertainty) {
  if (uncertainty < 0.05) return 'Low'
  if (uncertainty < 0.15) return 'Medium'
  return 'High'
}

function getTriageGrade(fracProb, uncertainty) {
  if (fracProb < 0.3 && uncertainty < 0.1) return { grade: 'Grade 1', desc: 'Self-manageable — RICE protocol' }
  if (fracProb < 0.6 || uncertainty >= 0.15) return { grade: 'Grade 2', desc: 'Monitor closely — consult if worsening' }
  return { grade: 'Grade 3', desc: 'Urgent — orthopaedic referral required' }
}

export default function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const { symptomResult, xrayResult } = location.state || {}

  const handleDownload = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin:       10,
      filename:     'boneai_triage_report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().from(element).set(opt).save();
  };

  // If no result data, redirect to triage
  if (!symptomResult && !xrayResult) {
    return (
      <div className="max-w-[640px] mx-auto px-6 py-20 text-center min-h-screen">
        <p className="font-inter text-body text-ghost-gray mb-4">
          No triage results found. Please start a new triage.
        </p>
        <Button variant="primary" onClick={() => navigate('/triage')}>
          Start Triage
        </Button>
      </div>
    )
  }

  const verdict = getVerdict(symptomResult, xrayResult)
  const fracProb = xrayResult?.fracture_prob ?? (symptomResult?.confidence ?? 0) * (symptomResult?.severity === 'high' ? 0.7 : 0.2)
  const uncertaintyVal = xrayResult?.uncertainty ?? 0
  const confidence = xrayResult ? (1 - uncertaintyVal) : (symptomResult?.confidence ?? 0)
  const triage = getTriageGrade(fracProb, uncertaintyVal)
  const hasXray = !!xrayResult && xrayResult.status !== 'retake'

  return (
    <div id="report-content" className="max-w-[800px] mx-auto px-6 py-10 min-h-screen">
      {/* ── Verdict Card ──────────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Badge variant={verdict.variant} className="text-body-sm px-4 py-1.5 mb-2">
              {verdict.label}
            </Badge>
            <p className="font-inter text-body text-ghost-gray">
              Confidence: {(confidence * 100).toFixed(1)}%
            </p>
          </div>

          {hasXray && (
            <ProbabilityGauge value={fracProb} />
          )}
        </div>
      </Card>

      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      {hasXray && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Fracture Probability */}
          <Card>
            <p className="font-inter text-caption text-mist-gray mb-1">
              Fracture Probability
            </p>
            <p className="font-bricolagegrotesque text-heading font-semibold text-midnight-ink mb-2">
              {(fracProb * 100).toFixed(1)}%
            </p>
            {/* Mini bar */}
            <div className="h-1.5 bg-pale-cloud rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fracProb * 100}%`,
                  backgroundColor: fracProb >= 0.5 ? '#e22ba4' : '#862fe7',
                }}
              />
            </div>
          </Card>

          {/* Uncertainty Score */}
          <Card>
            <p className="font-inter text-caption text-mist-gray mb-1">
              Uncertainty Score
            </p>
            <p className="font-bricolagegrotesque text-heading font-semibold text-midnight-ink mb-2">
              {(uncertaintyVal * 100).toFixed(1)}%
            </p>
            <Badge variant={uncertaintyVal < 0.05 ? 'success' : uncertaintyVal < 0.15 ? 'neutral' : 'danger'}>
              {getUncertaintyLabel(uncertaintyVal)}
            </Badge>
          </Card>

          {/* Triage Grade */}
          <Card>
            <p className="font-inter text-caption text-mist-gray mb-1">
              Triage Grade
            </p>
            <p className="font-bricolagegrotesque text-heading font-semibold text-midnight-ink mb-2">
              {triage.grade}
            </p>
            <p className="font-inter text-caption text-ghost-gray">
              {triage.desc}
            </p>
          </Card>
        </div>
      )}

      {/* ── Recommendation Card ───────────────────────────────────────── */}
      <Card className="mb-6">
        <h3 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-4">
          Recommended action
        </h3>

        {xrayResult?.status === 'radiologist_queue' ? (
          <p className="font-inter text-body text-ghost-gray mb-6">
            Your X-ray has been sent to the radiologist queue. You'll receive a detailed report within 2 hours.
            A qualified radiologist will review the image and provide a definitive diagnosis.
          </p>
        ) : xrayResult?.status === 'fracture' ? (
          <div className="font-inter text-body text-ghost-gray mb-6">
            <p className="mb-2"><strong className="text-midnight-ink font-semibold">Urgent referral recommended:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Visit the nearest orthopaedic surgeon immediately</li>
              <li>Immobilise the affected area — do not put weight on it</li>
              <li>Apply ice pack wrapped in cloth (20 min on / 20 min off)</li>
              <li>Keep the injured limb elevated above heart level</li>
              <li>Bring this report and X-ray to your appointment</li>
            </ul>
          </div>
        ) : (
          <div className="font-inter text-body text-ghost-gray mb-6">
            <p className="mb-2"><strong className="text-midnight-ink font-semibold">RICE Protocol:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-midnight-ink font-semibold">Rest</strong> — Avoid activities that cause pain</li>
              <li><strong className="text-midnight-ink font-semibold">Ice</strong> — Apply ice 20 min every 2-3 hours for 48 hours</li>
              <li><strong className="text-midnight-ink font-semibold">Compression</strong> — Use elastic bandage to reduce swelling</li>
              <li><strong className="text-midnight-ink font-semibold">Elevation</strong> — Keep injured area above heart level</li>
            </ul>
            <p className="mt-2">
              If symptoms persist beyond 48 hours or worsen, consult a healthcare provider.
            </p>
          </div>
        )}

        <div className="flex gap-4" data-html2canvas-ignore="true">
          <Button variant="secondary" onClick={handleDownload}>
            Download Report
          </Button>
          <Button variant="primary" onClick={() => navigate('/triage')}>
            Start new triage
          </Button>
        </div>
      </Card>

      {/* ── Grad-CAM Overlay ──────────────────────────────────────────── */}
      {xrayResult?.gradcam_base64 && (
        <Card>
          <h3 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-4">
            AI Analysis Overlay
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-inter text-caption text-mist-gray mb-2">
                Grad-CAM Heatmap Overlay
              </p>
              <img
                src={`data:image/png;base64,${xrayResult.gradcam_base64}`}
                alt="Grad-CAM heatmap overlay"
                className="w-full rounded-images"
              />
            </div>
          </div>

          <p className="font-inter text-body text-ghost-gray mt-4">
            Red regions indicate areas of concern detected by the model.
          </p>
        </Card>
      )}

      {/* ── Key Signals from NLP ──────────────────────────────────────── */}
      {symptomResult?.key_signals?.length > 0 && (
        <Card className="mt-6">
          <h3 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-4">
            Detected Clinical Signals
          </h3>
          <div className="flex flex-wrap gap-2">
            {symptomResult.key_signals.map((sig) => (
              <Badge key={sig} variant="neutral">
                {sig.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
