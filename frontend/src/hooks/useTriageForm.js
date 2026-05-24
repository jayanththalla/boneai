/**
 * useTriageForm — State management for the 3-step triage wizard.
 */
import { useState, useCallback } from 'react'

const SYMPTOM_SIGNALS = [
  { id: 'severe_swelling', label: 'Severe swelling' },
  { id: 'cannot_bear_weight', label: 'Cannot bear weight' },
  { id: 'heard_a_crack', label: 'Heard a crack' },
  { id: 'bruising_present', label: 'Bruising present' },
  { id: 'sharp_pain', label: 'Sharp pain' },
  { id: 'deformity_visible', label: 'Deformity visible' },
]

export default function useTriageForm() {
  // Current step: 1, 2, or 3
  const [step, setStep] = useState(1)

  // Step 1: Symptom capture
  const [symptomText, setSymptomText] = useState('')
  const [painScore, setPainScore] = useState(5)
  const [selectedSignals, setSelectedSignals] = useState([])
  const [photo, setPhoto] = useState(null)

  // Step 2: X-ray upload
  const [xrayFile, setXrayFile] = useState(null)
  const [xrayPreview, setXrayPreview] = useState(null)

  // API response state
  const [symptomResult, setSymptomResult] = useState(null)
  const [xrayResult, setXrayResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Processing status steps
  const [processingSteps, setProcessingSteps] = useState([
    { label: 'Symptom NLP analysis', status: 'pending' },
    { label: 'Running fracture detection', status: 'pending' },
    { label: 'Generating severity report', status: 'pending' },
  ])

  const toggleSignal = useCallback((signalId) => {
    setSelectedSignals((prev) =>
      prev.includes(signalId)
        ? prev.filter((s) => s !== signalId)
        : [...prev, signalId]
    )
  }, [])

  const updateProcessingStep = useCallback((index, status) => {
    setProcessingSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    )
  }, [])

  const reset = useCallback(() => {
    setStep(1)
    setSymptomText('')
    setPainScore(5)
    setSelectedSignals([])
    setPhoto(null)
    setXrayFile(null)
    setXrayPreview(null)
    setSymptomResult(null)
    setXrayResult(null)
    setIsLoading(false)
    setError(null)
    setProcessingSteps([
      { label: 'Symptom NLP analysis', status: 'pending' },
      { label: 'Running fracture detection', status: 'pending' },
      { label: 'Generating severity report', status: 'pending' },
    ])
  }, [])

  const canSubmitSymptoms = symptomText.trim().length > 0

  return {
    // State
    step,
    symptomText,
    painScore,
    selectedSignals,
    photo,
    xrayFile,
    xrayPreview,
    symptomResult,
    xrayResult,
    isLoading,
    error,
    processingSteps,
    canSubmitSymptoms,
    SYMPTOM_SIGNALS,

    // Setters
    setStep,
    setSymptomText,
    setPainScore,
    toggleSignal,
    setPhoto,
    setXrayFile,
    setXrayPreview,
    setSymptomResult,
    setXrayResult,
    setIsLoading,
    setError,
    updateProcessingStep,
    reset,
  }
}
