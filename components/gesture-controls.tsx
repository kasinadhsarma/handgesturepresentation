"use client"

import { useEffect, useRef, useState } from "react"
import * as handpose from "@tensorflow-models/handpose"
import "@tensorflow/tfjs-backend-webgl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface GestureControlsProps {
  onNext: () => void
  onPrevious: () => void
  onToggleDrawing: () => void
  isDrawing: boolean
}

export function GestureControls({ onNext, onPrevious, onToggleDrawing, isDrawing }: GestureControlsProps) {
  const [isHandposeLoaded, setIsHandposeLoaded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handposeModelRef = useRef<handpose.HandPose | null>(null)
  const lastGestureTimeRef = useRef<number>(0)
  const gestureCooldown = 1000 // 1 second cooldown between gestures

  // Initialize the handpose model
  useEffect(() => {
    async function loadHandposeModel() {
      try {
        handposeModelRef.current = await handpose.load()
        setIsHandposeLoaded(true)
        console.log("Handpose model loaded")
      } catch (error) {
        console.error("Error loading handpose model:", error)
      }
    }

    loadHandposeModel()

    return () => {
      // Clean up video and canvas
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Start/stop webcam and hand tracking
  useEffect(() => {
    if (!isActive || !isHandposeLoaded) return

    let animationFrameId: number

    async function setupCamera() {
      if (!videoRef.current) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })
        videoRef.current.srcObject = stream
        return new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve()
            }
          }
        })
      } catch (error) {
        console.error("Error accessing webcam:", error)
      }
    }

    async function detect() {
      if (!videoRef.current || !canvasRef.current || !handposeModelRef.current) return

      // Get hand predictions
      const predictions = await handposeModelRef.current.estimateHands(videoRef.current)

      // Clear canvas
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      // Process and visualize predictions
      if (predictions.length > 0) {
        // Draw hand landmarks
        drawHand(ctx, predictions[0].landmarks)

        // Detect gestures
        const gesture = detectGesture(predictions[0].landmarks)

        // Process gesture with cooldown
        const now = Date.now()
        if (gesture && now - lastGestureTimeRef.current > gestureCooldown) {
          setDetectedGesture(gesture)
          lastGestureTimeRef.current = now

          // Trigger actions based on gesture
          if (gesture === "next") {
            onNext()
          } else if (gesture === "previous") {
            onPrevious()
          } else if (gesture === "draw") {
            onToggleDrawing()
          }
        }
      } else {
        setDetectedGesture(null)
      }

      // Continue detection loop
      animationFrameId = requestAnimationFrame(detect)
    }

    setupCamera().then(() => {
      if (videoRef.current) {
        videoRef.current.play()
        // Set canvas dimensions to match video
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          // Start detection loop
          detect()
        }
      }
    })

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isActive, isHandposeLoaded, onNext, onPrevious, onToggleDrawing])

  // Draw hand landmarks on canvas
  function drawHand(ctx: CanvasRenderingContext2D, landmarks: number[][]) {
    // Draw points
    for (let i = 0; i < landmarks.length; i++) {
      const [x, y] = landmarks[i]
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "#FF0000"
      ctx.fill()
    }

    // Draw connections
    const fingers = [
      [0, 1, 2, 3, 4], // thumb
      [0, 5, 6, 7, 8], // index finger
      [0, 9, 10, 11, 12], // middle finger
      [0, 13, 14, 15, 16], // ring finger
      [0, 17, 18, 19, 20], // pinky
    ]

    for (const finger of fingers) {
      for (let i = 0; i < finger.length - 1; i++) {
        const [x1, y1] = landmarks[finger[i]]
        const [x2, y2] = landmarks[finger[i + 1]]

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = "#00FF00"
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  }

  // Simple gesture detection
  function detectGesture(landmarks: number[][]): string | null {
    // Extract finger positions
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]
    const wrist = landmarks[0]

    // Detect "next slide" gesture (index finger extended, others closed)
    const isNextSlideGesture =
      isFingerExtended(indexTip, wrist) &&
      !isFingerExtended(middleTip, wrist) &&
      !isFingerExtended(ringTip, wrist) &&
      !isFingerExtended(pinkyTip, wrist) &&
      !isFingerExtended(thumbTip, wrist)

    // Detect "previous slide" gesture (pinky finger extended, others closed)
    const isPrevSlideGesture =
      !isFingerExtended(indexTip, wrist) &&
      !isFingerExtended(middleTip, wrist) &&
      !isFingerExtended(ringTip, wrist) &&
      isFingerExtended(pinkyTip, wrist) &&
      !isFingerExtended(thumbTip, wrist)

    // Detect "draw" gesture (index and middle fingers extended, others closed)
    const isDrawGesture =
      isFingerExtended(indexTip, wrist) &&
      isFingerExtended(middleTip, wrist) &&
      !isFingerExtended(ringTip, wrist) &&
      !isFingerExtended(pinkyTip, wrist) &&
      !isFingerExtended(thumbTip, wrist)

    if (isNextSlideGesture) return "next"
    if (isPrevSlideGesture) return "previous"
    if (isDrawGesture) return "draw"

    return null
  }

  // Helper function to determine if a finger is extended
  function isFingerExtended(fingerTip: number[], wrist: number[]): boolean {
    // Simple check - if the finger tip is significantly higher than the wrist
    return fingerTip[1] < wrist[1] - 100
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant={isActive ? "default" : "outline"} onClick={() => setIsActive(!isActive)}>
          {isActive ? "Stop Camera" : "Start Camera"}
        </Button>

        {isActive && <div className="text-sm font-medium">{isHandposeLoaded ? "Model Ready" : "Loading Model..."}</div>}
      </div>

      {isActive && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="absolute w-full h-full object-cover opacity-0" playsInline />
            <canvas ref={canvasRef} className="absolute w-full h-full object-cover" />

            {detectedGesture && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                {detectedGesture}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <h4 className="font-medium">Available Gestures:</h4>
        <ul className="space-y-1 text-sm">
          <li>• Index finger up: Next slide</li>
          <li>• Pinky finger up: Previous slide</li>
          <li>• Index + Middle up: Toggle drawing mode</li>
          <li>• Hand open: Pointer mode</li>
          <li>• Thumb up: Erase drawing</li>
        </ul>
      </div>
    </div>
  )
}

