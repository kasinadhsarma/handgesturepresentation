import { NextResponse } from "next/server"

// Get gesture usage statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const period = searchParams.get("period") || "week" // day, week, month

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // In a real implementation, fetch from database
    // For demo, return sample statistics

    // Generate sample data based on period
    const stats = generateSampleStats(period)

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Get gesture stats error:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve gesture statistics" }, { status: 500 })
  }
}

// Helper function to generate sample statistics
function generateSampleStats(period: string) {
  // Common gesture types
  const gestureTypes = [
    "nextSlide",
    "previousSlide",
    "drawMode",
    "pointer",
    "erase",
    "highlight",
    "zoomIn",
    "zoomOut",
    "firstSlide",
    "lastSlide",
  ]

  // Generate usage counts
  const usageCounts = gestureTypes.reduce(
    (acc, gesture) => {
      acc[gesture] = Math.floor(Math.random() * 100) + 1 // 1-100 random count
      return acc
    },
    {} as Record<string, number>,
  )

  // Generate recognition rates (70-100%)
  const recognitionRates = gestureTypes.reduce(
    (acc, gesture) => {
      acc[gesture] = 0.7 + Math.random() * 0.3 // 0.7-1.0 random rate
      return acc
    },
    {} as Record<string, number>,
  )

  // Generate time series data
  let timeSeriesData: Array<{ date: string; counts: Record<string, number> }> = []

  const now = new Date()
  let numPoints = 7 // default to week

  if (period === "day") {
    numPoints = 24 // hours in a day
  } else if (period === "month") {
    numPoints = 30 // days in a month
  }

  for (let i = 0; i < numPoints; i++) {
    const date = new Date(now)

    if (period === "day") {
      date.setHours(date.getHours() - i)
    } else if (period === "week") {
      date.setDate(date.getDate() - i)
    } else if (period === "month") {
      date.setDate(date.getDate() - i)
    }

    const counts = gestureTypes.reduce(
      (acc, gesture) => {
        acc[gesture] = Math.floor(Math.random() * 20) // 0-19 random count
        return acc
      },
      {} as Record<string, number>,
    )

    timeSeriesData.push({
      date: date.toISOString().split("T")[0],
      counts,
    })
  }

  // Sort chronologically
  timeSeriesData = timeSeriesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    period,
    totalGesturesDetected: Object.values(usageCounts).reduce((sum, count) => sum + count, 0),
    usageCounts,
    recognitionRates,
    averageRecognitionRate: Object.values(recognitionRates).reduce((sum, rate) => sum + rate, 0) / gestureTypes.length,
    timeSeriesData,
  }
}

