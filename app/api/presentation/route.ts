import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Change presentation mode (presentation/annotation)
export async function PUT(request: NextRequest) {
  try {
    const { mode } = await request.json()
    
    if (!mode || !['presentation', 'annotation'].includes(mode)) {
      return NextResponse.json({ 
        error: 'Invalid mode. Use "presentation" or "annotation"' 
      }, { status: 400 })
    }

    const response = await fetch(`${FASTAPI_URL}/change-mode/${mode}`)
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        error: error.detail || 'Failed to change mode' 
      }, { status: response.status })
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('Mode change error:', error)
    return NextResponse.json({ 
      error: 'Failed to change presentation mode' 
    }, { status: 500 })
  }
}

// Get current presentation status
export async function GET() {
  try {
    const statusResponse = await fetch(`${FASTAPI_URL}/current-status/`)
    const healthResponse = await fetch(`${FASTAPI_URL}/health/`)
    
    if (!statusResponse.ok || !healthResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch presentation status' 
      }, { status: 500 })
    }

    const [status, health] = await Promise.all([
      statusResponse.json(),
      healthResponse.json()
    ])

    return NextResponse.json({
      ...status,
      health: {
        status: health.status,
        connections: health.connections,
        timestamp: health.timestamp
      }
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check presentation status' 
    }, { status: 500 })
  }
}
