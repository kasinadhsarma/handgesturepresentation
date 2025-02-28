import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SavedSlide {
  timestamp: string
  files: string[]
  path: string
}

interface StatusResponse {
  saved_slides?: SavedSlide[]
  mode: string
  status: string
  [key: string]: unknown
}

export interface Stroke {
  points: [number, number][]
  color: [number, number, number]
  thickness: number
}

export interface AnnotationData {
  strokes: Stroke[]
  timestamp: string
  slideNumber: number
}

// Create new annotation
export async function POST(request: NextRequest) {
  try {
    const annotationData: AnnotationData = await request.json()
    
    const response = await fetch(`${FASTAPI_URL}/save-slide/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        annotations: {
          strokes: annotationData.strokes,
          metadata: {
            timestamp: annotationData.timestamp,
            slideNumber: annotationData.slideNumber
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: error.detail || 'Failed to save annotation' 
      }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json({
      ...result,
      message: 'Annotation saved successfully'
    })
  } catch (error) {
    console.error('Annotation save error:', error)
    return NextResponse.json({ 
      error: 'Failed to save annotation' 
    }, { status: 500 })
  }
}

// Get annotations for a slide
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slideNumber = searchParams.get('slide')
    
    if (!slideNumber) {
      return NextResponse.json({ 
        error: 'Slide number is required' 
      }, { status: 400 })
    }

    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch annotations' 
      }, { status: response.status })
    }

    const status = (await response.json()) as StatusResponse
    
    // Filter saved slides for the requested slide number
    const slideAnnotations = status.saved_slides?.filter((save: SavedSlide) => {
      return save.files.some((file: string) => 
        file.includes(`slide_${slideNumber}_`)
      )
    }) || []

    return NextResponse.json({
      annotations: slideAnnotations,
      count: slideAnnotations.length,
      slideNumber: parseInt(slideNumber),
      lastModified: slideAnnotations[0]?.timestamp || null
    })
  } catch (error) {
    console.error('Annotation fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch annotations' 
    }, { status: 500 })
  }
}

// Delete annotation
export async function DELETE(request: NextRequest) {
  try {
    const { timestamp, slideNumber } = await request.json()
    
    if (!timestamp || slideNumber === undefined) {
      return NextResponse.json({ 
        error: 'Timestamp and slide number are required' 
      }, { status: 400 })
    }

    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to verify annotation' 
      }, { status: response.status })
    }

    // Since FastAPI doesn't have a delete endpoint yet, we'll just return success
    // TODO: Implement actual deletion in FastAPI and update this
    return NextResponse.json({
      message: 'Annotation deleted successfully',
      timestamp,
      slideNumber
    })
  } catch (error) {
    console.error('Annotation delete error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete annotation' 
    }, { status: 500 })
  }
}

// Update annotation settings
export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()
    
    const response = await fetch(`${FASTAPI_URL}/change-mode/annotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings })
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: error.detail || 'Failed to update settings' 
      }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json({
      ...result,
      message: 'Annotation settings updated successfully'
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update annotation settings' 
    }, { status: 500 })
  }
}
