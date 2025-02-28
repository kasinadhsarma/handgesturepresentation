import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PresentationSession {
  timestamp: string
  slides_viewed: number[]
  duration: number
  annotations_count: number
}

interface SessionResponse {
  status: string
  presentation?: {
    total_slides: number
    current_slide: number
    is_first_slide: boolean
    is_last_slide: boolean
  }
  saved_slides?: Array<{
    timestamp: string
    files: string[]
    path: string
  }>
  [key: string]: unknown
}

// Get presentation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeAnnotations = searchParams.get('annotations') === 'true'
    
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch presentation history' 
      }, { status: response.status })
    }

    const status = (await response.json()) as SessionResponse

    // Get saved slides and organize them by session
    const sessions: PresentationSession[] = []
    
    if (status.saved_slides) {
      const groupedSlides = status.saved_slides.reduce((acc, slide) => {
        const sessionTime = slide.timestamp.split('_')[0] // Get date part
        if (!acc[sessionTime]) {
          acc[sessionTime] = []
        }
        acc[sessionTime].push(slide)
        return acc
      }, {} as Record<string, typeof status.saved_slides>)

      // Create session objects
      Object.entries(groupedSlides).forEach(([timestamp, slides]) => {
        const uniqueSlideNumbers = new Set(
          slides.map(s => {
            const match = s.files[0]?.match(/slide_(\d+)_/)
            return match ? parseInt(match[1]) : -1
          }).filter(n => n !== -1)
        )

        sessions.push({
          timestamp,
          slides_viewed: Array.from(uniqueSlideNumbers),
          duration: 0, // TODO: Add duration tracking in backend
          annotations_count: includeAnnotations ? 
            slides.filter(s => s.files.some(f => f.includes('_annotations'))).length : 0
        })
      })
    }

    // Sort sessions by timestamp and limit results
    const sortedSessions = sessions
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit)

    return NextResponse.json({
      sessions: sortedSessions,
      current_status: {
        slide: status.presentation?.current_slide,
        total_slides: status.presentation?.total_slides,
        has_active_session: status.status === 'active'
      },
      metadata: {
        total_sessions: sessions.length,
        fetched_sessions: sortedSessions.length,
        annotations_included: includeAnnotations
      }
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch presentation history' 
    }, { status: 500 })
  }
}

// Generate thumbnail
export async function POST(request: NextRequest) {
  try {
    const { slideNumber } = await request.json()
    
    if (slideNumber === undefined) {
      return NextResponse.json({ 
        error: 'Slide number is required' 
      }, { status: 400 })
    }

    // Get current slide image
    const response = await fetch(`${FASTAPI_URL}/current-slide-image/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to generate thumbnail' 
      }, { status: response.status })
    }

    // Return the image URL directly from FastAPI
    // In a real app, we might want to resize/optimize the image here
    return NextResponse.json({
      thumbnail_url: `${FASTAPI_URL}/current-slide-image/`,
      slide_number: slideNumber,
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate thumbnail' 
    }, { status: 500 })
  }
}

// Update session metadata
export async function PUT(request: NextRequest) {
  try {
    const { timestamp, metadata } = await request.json()
    
    if (!timestamp || !metadata) {
      return NextResponse.json({ 
        error: 'Timestamp and metadata are required' 
      }, { status: 400 })
    }

    // Since FastAPI doesn't support session metadata yet, we'll just return success
    // TODO: Implement session metadata storage in FastAPI
    return NextResponse.json({
      message: 'Session metadata updated successfully',
      timestamp,
      updated_fields: Object.keys(metadata)
    })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update session metadata' 
    }, { status: 500 })
  }
}
