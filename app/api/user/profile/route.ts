import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserProfile } from '@/types'

interface SavedSlide {
  files: string[]
  timestamp: string
}

interface StatusResponse {
  saved_slides?: SavedSlide[]
  timestamp?: string
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Get user profile
export async function GET() {
  try {
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch user profile' 
      }, { status: response.status })
    }

    const status = await response.json() as StatusResponse

    // Calculate user stats from presentation data
    const stats = {
      totalPresentations: status.saved_slides?.length || 0,
      totalAnnotations: status.saved_slides?.reduce((acc: number, slide: SavedSlide) => 
        acc + (slide.files.filter((f: string) => f.includes('_annotations')).length), 0) || 0,
      lastActive: status.timestamp || new Date().toISOString()
    }

    const profile: UserProfile = {
      id: '1', // TODO: Implement proper user management
      username: 'demo_user',
      email: 'demo@example.com',
      preferences: {
        theme: 'light',
        gestureSpeed: 'medium',
        defaultAnnotationColor: '#00ff00'
      },
      stats
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user profile' 
    }, { status: 500 })
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    
    const response = await fetch(`${FASTAPI_URL}/current-status/`)
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: response.status })
    }

    // Update user preferences if provided
    if (updates.preferences) {
      const modeResponse = await fetch(`${FASTAPI_URL}/change-mode/${updates.preferences.gestureSpeed || 'medium'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates.preferences })
      })

      if (!modeResponse.ok) {
        return NextResponse.json({ 
          error: 'Failed to update preferences' 
        }, { status: modeResponse.status })
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      updated: updates
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update user profile' 
    }, { status: 500 })
  }
}
