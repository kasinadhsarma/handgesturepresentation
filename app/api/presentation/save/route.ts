import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const { slideData, annotations } = await request.json()
    
    // First save any annotations if provided
    if (annotations) {
      const annotationResponse = await fetch(`${FASTAPI_URL}/save-slide/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ annotations })
      })

      if (!annotationResponse.ok) {
        throw new Error('Failed to save annotations')
      }
    }

    // Then get the saved file info
    const response = await fetch(`${FASTAPI_URL}/save-slide/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to save slide' 
      }, { status: response.status })
    }

    const result = await response.json()
    
    // Enhance the response with additional metadata
    return NextResponse.json({
      ...result,
      savedAt: new Date().toISOString(),
      metadata: {
        hasAnnotations: !!annotations,
        slideNumber: slideData?.currentSlide || null,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ 
      error: 'Failed to save slide state' 
    }, { status: 500 })
  }
}

// Get list of saved slides
export async function GET() {
  try {
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch slides info' 
      }, { status: response.status })
    }

    const status = await response.json()
    
    // Check if there are any saved slides
    if (status.mode === 'annotation') {
      const saveResponse = await fetch(`${FASTAPI_URL}/save-slide/`)
      if (saveResponse.ok) {
        const savedSlides = await saveResponse.json()
        return NextResponse.json({
          ...status,
          savedSlides
        })
      }
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching saved slides:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch saved slides' 
    }, { status: 500 })
  }
}
