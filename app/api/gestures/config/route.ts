import { NextResponse } from "next/server"

// Get user's gesture configuration
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // In a real implementation, fetch from database
    // For demo, return sample configuration

    return NextResponse.json({
      success: true,
      config: {
        sensitivity: 0.7, // 0.0 to 1.0, higher means more sensitive
        gestureHoldTime: 500, // milliseconds to hold a gesture
        gestureMappings: [
          { gestureId: 1, action: "nextSlide" },
          { gestureId: 2, action: "previousSlide" },
          { gestureId: 3, action: "toggleDrawing" },
          { gestureId: 4, action: "showPointer" },
          { gestureId: 5, action: "erase" },
          { gestureId: 6, action: "highlight" },
          { gestureId: 7, action: "stopPresentation" },
          { gestureId: 8, action: "zoomIn" },
          { gestureId: 9, action: "zoomOut" },
          { gestureId: 10, action: "firstSlide" },
          { gestureId: 11, action: "lastSlide" },
          { gestureId: 12, action: "undo" },
          { gestureId: 13, action: "redo" },
          { gestureId: 14, action: "save" },
        ],
        enabledGestures: [1, 2, 3, 4, 5], // IDs of enabled gestures
      },
    })
  } catch (error) {
    console.error("Get gesture config error:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve gesture configuration" }, { status: 500 })
  }
}

// Update user's gesture configuration
export async function POST(request: Request) {
  try {
    const { userId, config } = await request.json()

    if (!userId || !config) {
      return NextResponse.json({ success: false, message: "Invalid configuration data" }, { status: 400 })
    }

    // Validate configuration
    if (typeof config.sensitivity !== "number" || config.sensitivity < 0 || config.sensitivity > 1) {
      return NextResponse.json({ success: false, message: "Sensitivity must be between 0 and 1" }, { status: 400 })
    }

    // In a real implementation, save to database
    // For demo, just return success

    return NextResponse.json({
      success: true,
      message: "Gesture configuration updated successfully",
    })
  } catch (error) {
    console.error("Update gesture config error:", error)
    return NextResponse.json({ success: false, message: "Failed to update gesture configuration" }, { status: 500 })
  }
}

