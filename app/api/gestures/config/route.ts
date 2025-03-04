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
        // Core sensitivity settings
        sensitivity: 0.7, // 0.0 to 1.0, higher means more sensitive
        gestureHoldTime: 500, // milliseconds to hold a gesture
        
        // Drawing settings
        drawing: {
          minFingerDistance: 30, // minimum distance for finger tracking
          brushSizes: [2, 5, 8, 12], // available brush sizes in pixels
          colors: ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"], // available colors
          defaultBrushSize: 5,
          defaultColor: "#000000",
          shapeDetectionThreshold: 0.85 // confidence threshold for shape detection
        },

        // Navigation settings
        navigation: {
          swipeThreshold: 100, // minimum distance for swipe detection
          holdTimeThreshold: 500, // ms to hold for first/last slide gestures
          doubleTapInterval: 300 // ms between taps for double-tap gestures
        },

        // Gesture recognition settings
        recognition: {
          rotationThreshold: 45, // degrees for rotation detection
          pinchThreshold: 50, // distance for pinch detection
          fingerProximityThreshold: 30 // distance for finger proximity detection
        },

        // Gesture mappings with detailed configurations
        gestureMappings: [
          // Navigation gestures
          { gestureId: 1, name: "Next Slide", action: "nextSlide", type: "navigation" },
          { gestureId: 2, name: "Previous Slide", action: "previousSlide", type: "navigation" },
          { gestureId: 3, name: "First Slide", action: "firstSlide", type: "navigation" },
          { gestureId: 4, name: "Last Slide", action: "lastSlide", type: "navigation" },
          
          // Drawing gestures
          { gestureId: 5, name: "Draw", action: "draw", type: "drawing" },
          { gestureId: 6, name: "Shape", action: "shape", type: "drawing" },
          { gestureId: 7, name: "Highlight", action: "highlight", type: "drawing" },
          { gestureId: 8, name: "Erase", action: "erase", type: "drawing" },
          
          // Control gestures
          { gestureId: 9, name: "Pointer", action: "pointer", type: "control" },
          { gestureId: 10, name: "Stop", action: "stop", type: "control" },
          { gestureId: 11, name: "Zoom In", action: "zoomIn", type: "control" },
          { gestureId: 12, name: "Zoom Out", action: "zoomOut", type: "control" },
          { gestureId: 13, name: "Undo", action: "undo", type: "control" },
          { gestureId: 14, name: "Redo", action: "redo", type: "control" },
          { gestureId: 15, name: "Save", action: "save", type: "control" }
        ],

        // Default enabled gestures by type
        enabledGestures: {
          navigation: [1, 2, 3, 4],
          drawing: [5, 6, 7, 8],
          control: [9, 10, 11, 12, 13, 14, 15]
        },

        // User preferences
        preferences: {
          autoSave: true,
          showGestureHints: true,
          calibrationRequired: true,
          handedness: "right" // or "left"
        }
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
