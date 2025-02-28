'use client'

import { useState, useRef } from 'react'

interface UploadState {
  progress: number
  status: 'idle' | 'uploading' | 'error' | 'success'
  error?: string
  file?: File
}

export function PresentationUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const resetUpload = () => {
    setUploadState({ progress: 0, status: 'idle' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async (file: File) => {
    setUploadState({
      progress: 0,
      status: 'uploading',
      file
    })

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Validate file type before uploading
      const validTypes = ['.pdf', '.pptx', '.ppt']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!validTypes.includes(fileExtension)) {
        throw new Error(`Invalid file type. Allowed types: ${validTypes.join(', ')}`)
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File size too large. Maximum size is 10MB')
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      // Update state to success
      setUploadState(prev => ({
        ...prev,
        status: 'success',
        progress: 100
      }))

      // Reset after 2 seconds
      setTimeout(() => {
        resetUpload()
        // Refresh the page to show new presentation
        window.location.reload()
      }, 2000)

    } catch (err) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed'
      }))
      
      // Reset error after 5 seconds
      setTimeout(resetUpload, 5000)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  return (
    <div className="space-y-4" onDrop={handleDrop} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${uploadState.status === 'error' ? 'border-red-300 bg-red-50' : 
            dragActive ? 'border-blue-500 bg-blue-50' :
            uploadState.status === 'success' ? 'border-green-300 bg-green-50' :
            'border-gray-300 hover:border-blue-400'}
          transition-colors cursor-pointer relative
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.pptx,.ppt"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleUpload(file)
            }
          }}
        />
        
        {uploadState.status === 'uploading' ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Uploading presentation...</p>
          </div>
        ) : uploadState.status === 'success' ? (
          <div className="flex flex-col items-center text-green-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="mt-2">Upload successful!</p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M24 14v6m0 0v6m0-6h6m-6 0h-6"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {dragActive ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF or PowerPoint files
            </p>
          </div>
        )}
      </div>

      {uploadState.status === 'error' && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {uploadState.error}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Supported formats:</p>
        <ul className="list-disc list-inside mt-1">
          <li>PowerPoint (.ppt, .pptx)</li>
          <li>PDF (.pdf)</li>
        </ul>
      </div>
    </div>
  )
}
