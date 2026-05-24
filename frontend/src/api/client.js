/**
 * API Client — Axios instance for FastAPI backend.
 */
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for model inference
})

// Attach session_id from localStorage to all requests
apiClient.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('boneai_session_id')
  if (sessionId) {
    if (config.params) {
      config.params.session_id = sessionId
    } else {
      config.params = { session_id: sessionId }
    }
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default apiClient

// ─── Triage API functions ─────────────────────────────────────────────────────

export async function postSymptoms({ text, painScore, signals, photoBase64 }) {
  const response = await apiClient.post('/triage/symptoms', {
    text,
    pain_score: painScore,
    signals,
    photo_base64: photoBase64 || null,
  })
  // Store session_id
  if (response.data.session_id) {
    localStorage.setItem('boneai_session_id', response.data.session_id)
  }
  return response.data
}

export async function postXray(file, sessionId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('session_id', sessionId)

  const response = await apiClient.post('/triage/xray', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function getCases({ status, page = 1, limit = 20 } = {}) {
  const params = { page, limit }
  if (status) params.status = status
  const response = await apiClient.get('/cases', { params })
  return response.data
}

export async function patchCase(reportId, { status, radiologistNote }) {
  const response = await apiClient.patch(`/cases/${reportId}`, {
    status,
    radiologist_note: radiologistNote,
  })
  return response.data
}
