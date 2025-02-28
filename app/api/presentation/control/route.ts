import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Get WebSocket connection details and initial state
export async function GET() {
  try {
    const [statusResponse, healthResponse] = await Promise.all([
      fetch(`${FASTAPI_URL}/current-status/`),
      fetch(`${FASTAPI_URL}/health/`)
    ])

    if (!statusResponse.ok || !healthResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to get control status' 
      }, { status: 500 })
    }

    const [status, health] = await Promise.all([
      statusResponse.json(),
      healthResponse.json()
    ])

    // Generate WebSocket connection info
    const wsUrl = `${FASTAPI_URL.replace('http', 'ws')}/ws/gesture_control/${Date.now()}`
    
    return NextResponse.json({
      wsUrl,
      status: {
        ...status,
        health: health.status,
        connections: health.connections
      },
      supportedGestures: [
        { name: 'next_slide', description: 'Move to next slide' },
        { name: 'prev_slide', description: 'Move to previous slide' },
        { name: 'firstSlide', description: 'Jump to first slide' },
        { name: 'lastSlide', description: 'Jump to last slide' },
        { name: 'draw', description: 'Enter drawing mode' },
        { name: 'pointer', description: 'Use pointer mode' },
        { name: 'stop', description: 'Stop presentation' },
        { name: 'zoomIn', description: 'Zoom in' },
        { name: 'zoomOut', description: 'Zoom out' },
        { name: 'undo', description: 'Undo last action' },
        { name: 'redo', description: 'Redo last action' },
        { name: 'save', description: 'Save current slide' }
      ]
    })
  } catch (error) {
    console.error('Control initialization error:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize gesture control' 
    }, { status: 500 })
  }
}

// Update control settings
export async function POST(request: NextRequest) {
  try {
    const { mode, gesture, settings } = await request.json()
    
    const updates = []

    // Handle mode changes
    if (mode) {
      const modeResponse = await fetch(`${FASTAPI_URL}/change-mode/${mode}`)
      if (!modeResponse.ok) {
        throw new Error('Failed to change mode')
      }
      updates.push({ type: 'mode', value: mode })
    }

    // Handle specific gesture modifications
    if (gesture) {
      // Add to updates list for tracking changes
      updates.push({ type: 'gesture', value: gesture })
      
      // Could be extended to store gesture preferences
      // or modify gesture recognition parameters
      console.log('Gesture modification:', gesture)
    }

    // Handle gesture sensitivity/settings changes
    if (settings) {
      // Store user preferences if needed
      // This could be extended to store in a database
      console.log('Updated gesture settings:', settings)
    }

    // Get updated status
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      throw new Error('Failed to get updated status')
    }

    const status = await response.json()
    
    return NextResponse.json({
      status,
      updated: {
        mode: mode || status.mode,
        settings: settings || {},
        timestamp: new Date().toISOString(),
        changes: updates
      }
    })
  } catch (error) {
    console.error('Control update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update control settings' 
    }, { status: 500 })
  }
}
