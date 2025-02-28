import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { DashboardStats } from '@/types'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SavedSlide {
  files: string[]
  timestamp: string
  path: string
}

interface StatusResponse {
  saved_slides?: SavedSlide[]
  timestamp?: string
  presentation?: {
    total_slides: number
    current_slide: number
  }
  settings?: {
    brush_color: [number, number, number]
    brush_size: number
  }
  mode: string
  status: string
}

// Get dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const [statusResponse, healthResponse] = await Promise.all([
      fetch(`${FASTAPI_URL}/current-status/`),
      fetch(`${FASTAPI_URL}/health/`)
    ])

    if (!statusResponse.ok || !healthResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch dashboard data' 
      }, { status: 500 })
    }

    const [status, health] = await Promise.all([
      statusResponse.json() as Promise<StatusResponse>,
      healthResponse.json()
    ])

    // Get recent presentations from saved slides
    interface PresentationInfo {
      id: string
      title: string
      last_viewed: string
      total_slides: number
      annotations_count: number
    }

    const recentPresentations = (status.saved_slides || [])
      .reduce((presentations: Record<string, PresentationInfo>, slide) => {
        const presentationId = slide.path.split('/')[1] // Get presentation ID from path
        if (!presentations[presentationId]) {
          presentations[presentationId] = {
            id: presentationId,
            title: `Presentation ${presentationId}`,
            last_viewed: slide.timestamp,
            total_slides: status.presentation?.total_slides || 0,
            annotations_count: 0
          }
        }
        if (slide.files.some(f => f.includes('_annotations'))) {
          presentations[presentationId].annotations_count++
        }
        return presentations
      }, {})

    // Calculate activity summary
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    let activeStreak = 0
    const uniqueDays = new Set<string>()
    let totalSlidesViewed = 0
    const totalGesturesDetected = 0 // TODO: Implement gesture tracking

    status.saved_slides?.forEach(slide => {
      const slideDate = new Date(slide.timestamp)
      if (slideDate > cutoffDate) {
        uniqueDays.add(slideDate.toISOString().split('T')[0])
        totalSlidesViewed++
      }
    })

    // Calculate active days streak
    const sortedDays = Array.from(uniqueDays).sort()
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const currentDate = new Date(sortedDays[i])
      const previousDate = new Date(currentDate)
      previousDate.setDate(previousDate.getDate() - 1)
      
      if (i === sortedDays.length - 1 || 
          sortedDays[i + 1] === previousDate.toISOString().split('T')[0]) {
        activeStreak++
      } else {
        break
      }
    }

    const dashboardStats: DashboardStats = {
      recent_presentations: Object.values(recentPresentations)
        .sort((a, b) => new Date(b.last_viewed).getTime() - new Date(a.last_viewed).getTime())
        .slice(0, 5),
      activity_summary: {
        total_presentations: Object.keys(recentPresentations).length,
        total_slides_viewed: totalSlidesViewed,
        total_annotations: (status.saved_slides || [])
          .reduce((count, slide) => 
            count + slide.files.filter(f => f.includes('_annotations')).length, 0),
        total_gestures_detected: totalGesturesDetected,
        active_days_streak: activeStreak
      },
      preferences: {
        theme: 'light', // TODO: Get from user preferences
        gestureSpeed: 'medium',
        defaultAnnotationColor: `rgb(${status.settings?.brush_color.join(',') || '0,255,0'})`
      }
    }

    return NextResponse.json({
      stats: dashboardStats,
      system_health: {
        status: health.status,
        connections: health.connections,
        last_update: health.timestamp
      }
    })
  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data' 
    }, { status: 500 })
  }
}

// Update dashboard preferences
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    
    if (updates.preferences) {
      const response = await fetch(`${FASTAPI_URL}/change-mode/${updates.preferences.gestureSpeed || 'medium'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          settings: {
            brush_color: updates.preferences.defaultAnnotationColor 
              ? updates.preferences.defaultAnnotationColor.match(/\d+/g).map(Number) 
              : [0, 255, 0],
            brush_size: 5 // Default size
          }
        })
      })

      if (!response.ok) {
        return NextResponse.json({ 
          error: 'Failed to update preferences' 
        }, { status: response.status })
      }
    }

    return NextResponse.json({
      message: 'Dashboard preferences updated successfully',
      updated: updates
    })
  } catch (error) {
    console.error('Dashboard update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update dashboard preferences' 
    }, { status: 500 })
  }
}
