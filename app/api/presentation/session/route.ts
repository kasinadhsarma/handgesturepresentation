import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SessionMetrics {
  duration: number
  slides_viewed: number[]
  annotations_count: number
  gestures_detected: {
    [key: string]: number
  }
  start_time: string
  last_activity: string
}

interface SavedSlide {
  timestamp: string
  files: string[]
  path: string
}

interface PresentationStatus {
  current_slide?: number
  total_slides?: number
  saved_slides?: SavedSlide[]
}

interface APIStatus {
  status: string
  mode: string
  presentation?: PresentationStatus
  settings?: Record<string, unknown>
  saved_slides?: SavedSlide[]
}

interface SessionState {
  is_active: boolean
  current_mode: string
  current_slide: number
  total_slides: number
  settings: Record<string, unknown>
}

// Start new session
export async function POST(request: NextRequest) {
  try {
    const { presentationId } = await request.json()
    
    if (!presentationId) {
      return NextResponse.json({ 
        error: 'Presentation ID is required' 
      }, { status: 400 })
    }

    // Initialize WebSocket connection
    const wsUrl = `${FASTAPI_URL.replace('http', 'ws')}/ws/gesture_control/${presentationId}`
    
    // Get initial presentation status
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to start session' 
      }, { status: response.status })
    }

    return NextResponse.json({
      session_id: `${presentationId}_${Date.now()}`,
      websocket_url: wsUrl,
      started_at: new Date().toISOString(),
      initial_state: {
        is_active: true,
        current_mode: 'presentation',
        metrics: {
          duration: 0,
          slides_viewed: [],
          annotations_count: 0,
          gestures_detected: {}
        }
      }
    })
  } catch (error) {
    console.error('Session start error:', error)
    return NextResponse.json({ 
      error: 'Failed to start presentation session' 
    }, { status: 500 })
  }
}

// Get session state
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session')
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 })
    }

    const [statusResponse, healthResponse] = await Promise.all([
      fetch(`${FASTAPI_URL}/current-status/`),
      fetch(`${FASTAPI_URL}/health/`)
    ])

    if (!statusResponse.ok || !healthResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch session state' 
      }, { status: 500 })
    }

    const [status, health] = await Promise.all([
      statusResponse.json(),
      healthResponse.json()
    ])

    const state: SessionState = {
      is_active: status.status === 'active',
      current_mode: status.mode,
      current_slide: status.presentation?.current_slide || 1,
      total_slides: status.presentation?.total_slides || 0,
      settings: status.settings || {}
    }

    const metrics: SessionMetrics = {
      duration: Math.floor((Date.now() - new Date(sessionId.split('_')[1]).getTime()) / 1000),
      slides_viewed: status.presentation ? 
        Array.from(new Set(status.saved_slides?.map((s: SavedSlide) => {
          const match = s.files[0]?.match(/slide_(\d+)_/)
          return match ? parseInt(match[1]) : -1
        }).filter((n: number) => n !== -1))) : [],
      annotations_count: status.saved_slides?.filter((s: SavedSlide) => 
        s.files.some((f: string) => f.includes('_annotations'))
      ).length || 0,
      gestures_detected: {}, // TODO: Implement gesture tracking in backend
      start_time: new Date(sessionId.split('_')[1]).toISOString(),
      last_activity: health.timestamp
    }

    return NextResponse.json({
      session_id: sessionId,
      state,
      metrics,
      health: {
        status: health.status,
        connections: health.connections
      }
    })
  } catch (error) {
    console.error('Session state error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch session state' 
    }, { status: 500 })
  }
}

// End session
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 })
    }

    // Get final session state
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to end session' 
      }, { status: response.status })
    }

    const status = await response.json() as APIStatus

    // Calculate session metrics
    const duration = Math.floor((Date.now() - new Date(sessionId.split('_')[1]).getTime()) / 1000)
    const slidesViewed = status.presentation ? 
      Array.from(new Set(status.saved_slides?.map((s: SavedSlide) => {
        const match = s.files[0]?.match(/slide_(\d+)_/)
        return match ? parseInt(match[1]) : -1
      }).filter((n: number) => n !== -1))) : []

    return NextResponse.json({
      session_id: sessionId,
      ended_at: new Date().toISOString(),
      final_metrics: {
        duration,
        slides_viewed: slidesViewed,
        annotations_count: status.saved_slides?.filter((s: SavedSlide) => 
          s.files.some((f: string) => f.includes('_annotations'))
        ).length || 0
      }
    })
  } catch (error) {
    console.error('Session end error:', error)
    return NextResponse.json({ 
      error: 'Failed to end session' 
    }, { status: 500 })
  }
}
