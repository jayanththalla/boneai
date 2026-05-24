/**
 * useXrayUpload — Drag-and-drop file handling for X-ray images.
 */
import { useState, useCallback } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export default function useXrayUpload({ onFileAccepted }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const validateFile = useCallback((file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG or PNG image.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 20 MB limit.'
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file) => {
      const error = validateFile(file)
      if (error) {
        setUploadError(error)
        return
      }
      setUploadError(null)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      onFileAccepted(file, previewUrl)
    },
    [validateFile, onFileAccepted]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onFileInputChange = useCallback(
    (e) => {
      const file = e.target.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return {
    isDragging,
    uploadError,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileInputChange,
  }
}
