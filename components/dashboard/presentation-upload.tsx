'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import styles from '@/styles/upload.module.css'

interface FileWithPreview extends File {
  preview?: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadState {
  file: FileWithPreview | null
  uploadProgress: number
  uploadStatus: UploadStatus
  errorMessage: string
}

export function PresentationUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    uploadProgress: 0,
    uploadStatus: 'idle',
    errorMessage: ''
  })

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return 'File size must be less than 50MB'
    }
    return null
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0] as FileWithPreview
    const error = validateFile(file)
    
    if (error) {
      setState(prev => ({
        ...prev,
        errorMessage: error,
        uploadStatus: 'error'
      }))
      return
    }

    setState(prev => ({
      ...prev,
      file,
      errorMessage: '',
      uploadStatus: 'idle',
      uploadProgress: 0
    }))
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
    },
    multiple: false,
  })

  const simulateUpload = async () => {
    setState(prev => ({
      ...prev,
      uploadStatus: 'uploading',
      uploadProgress: 0
    }))

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setState(prev => ({
          ...prev,
          uploadProgress: i
        }))
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setState(prev => ({
        ...prev,
        uploadStatus: 'success'
      }))
    } catch {
      setState(prev => ({
        ...prev,
        uploadStatus: 'error',
        errorMessage: 'Failed to upload file. Please try again.'
      }))
    }
  }

  const handleUpload = async () => {
    if (!state.file) return
    await simulateUpload()
  }

  const resetUpload = () => {
    setState({
      file: null,
      uploadProgress: 0,
      uploadStatus: 'idle',
      errorMessage: ''
    })
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--upload-progress', `${state.uploadProgress}%`)
  }, [state.uploadProgress])

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Upload Presentation</h2>
        {state.file && (
          <button
            onClick={resetUpload}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {state.errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.errorMessage}</AlertDescription>
        </Alert>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${state.uploadStatus === 'success' ? 'border-green-500 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <Upload 
            className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          />
          {isDragActive ? (
            <p className="text-blue-500 font-medium">Drop your presentation here...</p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">Drag & drop your presentation here</p>
              <p className="text-sm text-gray-500">Or click to browse files</p>
              <p className="text-xs text-gray-400">Supported formats: PPT, PPTX (Max 50MB)</p>
            </div>
          )}
        </div>
      </div>

      {state.file && state.uploadStatus !== 'success' && (
        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-500 mt-1" />
            <div className="flex-grow">
              <p className="font-medium text-gray-900">{state.file?.name}</p>
              <p className="text-sm text-gray-500">
                {(state.file?.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleUpload}
              disabled={state.uploadStatus === 'uploading'}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm
                ${state.uploadStatus === 'uploading'
                  ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'}
              `}
            >
              {state.uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {state.uploadStatus === 'uploading' && (
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-blue-500 transition-all duration-300 ${styles.uploadProgress}`}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Uploading... {state.uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {state.uploadStatus === 'success' && (
        <div className="mt-4 bg-green-50 text-green-700 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          <p className="font-medium">Upload completed successfully!</p>
        </div>
      )}
    </div>
  )
}

export default PresentationUpload