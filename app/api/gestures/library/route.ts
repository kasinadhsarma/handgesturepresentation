import { NextResponse } from "next/server"

// Sample gesture library data
const gestureLibrary = [
  {
    id: 1,
    name: "Next Slide",
    description: "Index finger extended, others closed",
    defaultAction: "nextSlide",
    thumbnailUrl: "/gestures/next-slide.png",
    difficulty: "easy",
  },
  {
    id: 2,
    name: "Previous Slide",
    description: "Pinky finger extended, others closed",
    defaultAction: "previousSlide",
    thumbnailUrl: "/gestures/prev-slide.png",
    difficulty: "easy",
  },
  {
    id: 3,
    name: "Draw Mode",
    description: "Index and middle fingers extended, others closed",
    defaultAction: "toggleDrawing",
    thumbnailUrl: "/gestures/draw-mode.png",
    difficulty: "medium",
  },
  {
    id: 4,
    name: "Pointer",
    description: "All fingers extended, palm open",
    defaultAction: "showPointer",
    thumbnailUrl: "/gestures/pointer.png",
    difficulty: "easy",
  },
  {
    id: 5,
    name: "Erase",
    description: "Thumb up, other fingers closed",
    defaultAction: "erase",
    thumbnailUrl: "/gestures/erase.png",
    difficulty: "medium",
  },
  {
    id: 6,
    name: "Highlight",
    description: "Index, middle, and ring fingers extended",
    defaultAction: "highlight",
    thumbnailUrl: "/gestures/highlight.png",
    difficulty: "medium",
  },
  {
    id: 7,
    name: "Stop Presentation",
    description: "Closed fist",
    defaultAction: "stopPresentation",
    thumbnailUrl: "/gestures/stop.png",
    difficulty: "easy",
  },
  {
    id: 8,
    name: "Zoom In",
    description: "Pinch out gesture",
    defaultAction: "zoomIn",
    thumbnailUrl: "/gestures/zoom-in.png",
    difficulty: "hard",
  },
  {
    id: 9,
    name: "Zoom Out",
    description: "Pinch in gesture",
    defaultAction: "zoomOut",
    thumbnailUrl: "/gestures/zoom-out.png",
    difficulty: "hard",
  },
  {
    id: 10,
    name: "First Slide",
    description: "All fingers extended, then quick swipe left",
    defaultAction: "firstSlide",
    thumbnailUrl: "/gestures/first-slide.png",
    difficulty: "hard",
  },
  {
    id: 11,
    name: "Last Slide",
    description: "All fingers extended, then quick swipe right",
    defaultAction: "lastSlide",
    thumbnailUrl: "/gestures/last-slide.png",
    difficulty: "hard",
  },
  {
    id: 12,
    name: "Undo",
    description: "Counterclockwise circle with index finger",
    defaultAction: "undo",
    thumbnailUrl: "/gestures/undo.png",
    difficulty: "hard",
  },
  {
    id: 13,
    name: "Redo",
    description: "Clockwise circle with index finger",
    defaultAction: "redo",
    thumbnailUrl: "/gestures/redo.png",
    difficulty: "hard",
  },
  {
    id: 14,
    name: "Save",
    description: "Thumbs up and hold for 2 seconds",
    defaultAction: "save",
    thumbnailUrl: "/gestures/save.png",
    difficulty: "medium",
  },
]

// Get all gestures or filter by difficulty
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get("difficulty")

    let filteredGestures = [...gestureLibrary]

    if (difficulty) {
      filteredGestures = gestureLibrary.filter((gesture) => gesture.difficulty === difficulty)
    }

    return NextResponse.json({
      success: true,
      gestures: filteredGestures,
    })
  } catch (error) {
    console.error("Gesture library error:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve gesture library" }, { status: 500 })
  }
}

// Add a new custom gesture to the library
export async function POST(request: Request) {
  try {
    const { name, description, action, userId } = await request.json()

    if (!name || !description || !action || !userId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // In a real implementation, save to database
    // For demo, we'll just return a success response

    return NextResponse.json({
      success: true,
      message: "Custom gesture added to library",
      gesture: {
        id: Date.now(),
        name,
        description,
        defaultAction: action,
        thumbnailUrl: "/gestures/custom.png",
        difficulty: "custom",
        createdBy: userId,
      },
    })
  } catch (error) {
    console.error("Add gesture error:", error)
    return NextResponse.json({ success: false, message: "Failed to add custom gesture" }, { status: 500 })
  }
}

