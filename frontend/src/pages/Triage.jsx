import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import useTriageForm from '../hooks/useTriageForm'
import useXrayUpload from '../hooks/useXrayUpload'
import { postSymptoms, postXray } from '../api/client'

const STEP_LABELS = ['Symptoms', 'X-ray', 'Processing']

export default function Triage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const form = useTriageForm()

  const xrayUpload = useXrayUpload({
    onFileAccepted: (file, preview) => {
      form.setXrayFile(file)
      form.setXrayPreview(preview)
    },
  })

  // ── Step 1: Submit symptoms ────────────────────────────────────────────
  const handleSubmitSymptoms = useCallback(async () => {
    form.setIsLoading(true)
    form.setError(null)

    try {
      const result = await postSymptoms({
        text: form.symptomText,
        painScore: form.painScore,
        signals: form.selectedSignals,
        photoBase64: null,
      })

      form.setSymptomResult(result)

      if (result.xray_required) {
        form.setStep(2)
      } else {
        navigate('/result', {
          state: {
            symptomResult: result,
            xrayResult: null,
          },
        })
      }
    } catch (err) {
      form.setError(err.response?.data?.detail || 'Failed to analyse symptoms. Please try again.')
    } finally {
      form.setIsLoading(false)
    }
  }, [form, navigate])

  // ── Step 2: Submit X-ray ───────────────────────────────────────────────
  const handleSubmitXray = useCallback(async () => {
    if (!form.xrayFile || !form.symptomResult) return

    form.setStep(3)
    form.setIsLoading(true)
    form.setError(null)

    form.updateProcessingStep(0, 'complete')
    form.updateProcessingStep(1, 'loading')

    try {
      const result = await postXray(form.xrayFile, form.symptomResult.session_id)

      form.updateProcessingStep(1, 'complete')
      form.updateProcessingStep(2, 'loading')

      form.setXrayResult(result)

      await new Promise((r) => setTimeout(r, 800))
      form.updateProcessingStep(2, 'complete')

      await new Promise((r) => setTimeout(r, 500))

      navigate('/result', {
        state: {
          symptomResult: form.symptomResult,
          xrayResult: result,
        },
      })
    } catch (err) {
      form.setError(err.response?.data?.detail || 'X-ray analysis failed. Please try again.')
      form.setStep(2)
    } finally {
      form.setIsLoading(false)
    }
  }, [form, navigate])

  return (
    <div className="max-w-[640px] mx-auto px-6 py-10 min-h-screen">
      {/* ── Step Indicator ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isActive = form.step === stepNum
          const isComplete = form.step > stepNum

          return (
            <div key={label} className="flex items-center">
              <Badge
                variant={isActive || isComplete ? 'inverse' : 'neutral'}
              >
                {label}
              </Badge>
              {i < STEP_LABELS.length - 1 && (
                <div className="w-8 h-[1px] bg-mist-gray mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Error Toast ─────────────────────────────────────────────────── */}
      {form.error && (
        <Card className="mb-4 !border-l-4 border-l-rose-bloom border-mist-gray !p-4">
          <p className="text-body font-inter text-rose-bloom">
            {form.error}
          </p>
        </Card>
      )}

      {/* ── STEP 1: Symptom Capture ─────────────────────────────────────── */}
      {form.step === 1 && (
        <div>
          <h2 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-6">
            Tell us about your injury
          </h2>

          {/* Textarea */}
          <div className="mb-5">
            <Input
              as="textarea"
              value={form.symptomText}
              onChange={(e) => form.setSymptomText(e.target.value)}
              placeholder="Describe your pain, swelling, and how the injury happened... (Hindi, English, or any Indian language)"
              className="min-h-[120px]"
            />
          </div>

          {/* Quick-select chips */}
          <div className="mb-5">
            <label className="block font-inter text-caption text-ghost-gray mb-2">
              Quick signals (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {form.SYMPTOM_SIGNALS.map((sig) => {
                const isSelected = form.selectedSignals.includes(sig.id)
                return (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => form.toggleSignal(sig.id)}
                    className={[
                      'inline-flex items-center',
                      'rounded-badges',
                      'px-3 py-1',
                      'font-inter text-caption',
                      'cursor-pointer',
                      'transition-all duration-150',
                      isSelected
                        ? 'bg-midnight-ink text-canvas-white'
                        : 'bg-canvas-white border border-mist-gray text-midnight-ink hover:bg-pale-cloud',
                    ].join(' ')}
                  >
                    {sig.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pain score slider */}
          <div className="mb-5">
            <label className="block font-inter text-caption text-ghost-gray mb-2">
              Pain score: <span className="font-medium text-midnight-ink">{form.painScore}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.painScore}
              onChange={(e) => form.setPainScore(parseInt(e.target.value))}
              className="w-full accent-royal-amethyst"
            />
            <div className="flex justify-between font-inter text-caption text-mist-gray mt-1">
              <span>Mild</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Optional photo upload */}
          <div className="mb-6">
            <div
              className={[
                'border-2 border-dashed border-mist-gray',
                'rounded-images',
                'p-4',
                'text-center',
                'cursor-pointer',
                'hover:bg-pale-cloud',
                'transition-colors duration-150 bg-canvas-white',
              ].join(' ')}
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              <svg className="mx-auto mb-2 opacity-40 text-mist-gray" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="font-inter text-caption text-ghost-gray">
                Upload injury photo (optional)
              </p>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => form.setPhoto(e.target.files[0])}
              />
            </div>
          </div>

          {/* Submit button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmitSymptoms}
            disabled={!form.canSubmitSymptoms || form.isLoading}
          >
            {form.isLoading ? 'Analysing...' : 'Analyse Symptoms'}
          </Button>
        </div>
      )}

      {/* ── STEP 2: X-ray Upload ────────────────────────────────────────── */}
      {form.step === 2 && (
        <div>
          {/* Risk alert card */}
          <Card className="mb-6 !border-l-4 border-l-rose-bloom !p-4 border-mist-gray">
            <p className="font-inter text-body text-midnight-ink">
              <strong className="font-semibold">High fracture risk detected.</strong> X-ray recommended for confirmation.
            </p>
          </Card>

          {/* Drag-and-drop upload zone */}
          <div
            className={[
              'border-2 border-dashed',
              xrayUpload.isDragging
                ? 'border-midnight-ink bg-pale-cloud'
                : 'border-mist-gray bg-canvas-white',
              'rounded-images',
              'p-10',
              'text-center',
              'cursor-pointer',
              'hover:bg-pale-cloud',
              'transition-all duration-150',
              'mb-4',
            ].join(' ')}
            onDragOver={xrayUpload.onDragOver}
            onDragLeave={xrayUpload.onDragLeave}
            onDrop={xrayUpload.onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {form.xrayPreview ? (
              <img
                src={form.xrayPreview}
                alt="X-ray preview"
                className="max-h-[200px] mx-auto rounded-images mb-2"
              />
            ) : (
              <>
                <svg className="mx-auto mb-2 opacity-40 text-mist-gray" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="font-inter text-body text-ghost-gray">
                  Drop X-ray here or click to browse
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={xrayUpload.onFileInputChange}
            />
          </div>

          {/* Upload error */}
          {xrayUpload.uploadError && (
            <p className="font-inter text-caption text-rose-bloom mb-4">
              {xrayUpload.uploadError}
            </p>
          )}

          {/* Quality check indicator */}
          {form.xrayFile && (
            <div className="mb-4">
              <Badge variant="success">
                Image loaded: {form.xrayFile.name}
              </Badge>
            </div>
          )}

          {/* Submit button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmitXray}
            disabled={!form.xrayFile || form.isLoading}
          >
            {form.isLoading ? 'Analysing...' : 'Analyse X-ray'}
          </Button>
        </div>
      )}

      {/* ── STEP 3: Processing ──────────────────────────────────────────── */}
      {form.step === 3 && (
        <div className="text-center py-10">
          <Spinner size={56} className="mb-6" />

          <h2 className="font-bricolagegrotesque text-display-sm font-semibold text-midnight-ink mb-6">
            Analysing your X-ray
          </h2>

          <div className="flex flex-col gap-3 max-w-[300px] mx-auto text-left">
            {form.processingSteps.map((ps, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Status icon */}
                {ps.status === 'complete' && (
                  <span className="text-royal-amethyst text-body font-bold">✓</span>
                )}
                {ps.status === 'loading' && (
                  <Spinner size={16} />
                )}
                {ps.status === 'pending' && (
                  <span className="text-mist-gray text-body">○</span>
                )}

                {/* Label */}
                <span
                  className={[
                    'font-inter text-body',
                    ps.status === 'complete'
                      ? 'text-midnight-ink font-semibold'
                      : ps.status === 'loading'
                      ? 'text-midnight-ink'
                      : 'text-mist-gray',
                  ].join(' ')}
                >
                  {ps.status === 'complete'
                    ? `${ps.label} complete`
                    : ps.status === 'loading'
                    ? `${ps.label}...`
                    : ps.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
