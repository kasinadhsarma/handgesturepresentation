import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 10MB' 
      }, { status: 400 })
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF and PowerPoint files are allowed',
        allowedTypes: ALLOWED_TYPES
      }, { status: 400 })
    }

    // Create new FormData for FastAPI
    const apiFormData = new FormData()
    apiFormData.append('file', file)

    // Send to FastAPI with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(`${FASTAPI_URL}/upload-presentation/`, {
        method: 'POST',
        body: apiFormData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json()
        console.error('FastAPI upload error:', error)
        throw new Error(error.detail || 'Upload failed')
      }

      const result = await response.json()

      // Create standardized response
      return NextResponse.json({
        id: result.filename,
        title: file.name,
        date: new Date().toISOString(),
        totalSlides: result.slides,
        fileType: result.file_type,
        status: 'success',
        message: result.message
      })
    } catch (error) {
      if (error instanceof Error) {
        // Check for timeout
        if (error.name === 'AbortError') {
          return NextResponse.json({ 
            error: 'Upload timeout. Please try again.' 
          }, { status: 504 })
        }
        // Check for network errors
        if (error.message.includes('Failed to fetch')) {
          return NextResponse.json({ 
            error: 'Unable to connect to server. Please try again.' 
          }, { status: 503 })
        }
      }
      throw error // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Upload error:', error)
    
    // Return user-friendly error message
    return NextResponse.json({ 
      error: 'Failed to upload presentation. Please try again later.',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      throw new Error('Failed to fetch upload status')
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check upload status' 
    }, { status: 500 })
  }
}

// Configure body parser
export const config = {
  api: {
    bodyParser: false,
  },
}
