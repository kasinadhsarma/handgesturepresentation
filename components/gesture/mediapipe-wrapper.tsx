'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from "@/lib/utils"

interface MediaPipeWrapperProps {
  onGesture: (gesture: string) => void
  onReady: () => void
  onError: (error: Error) => void
}

export function MediaPipeWrapper({ onGesture, onReady, onError }: MediaPipeWrapperProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)

  useEffect(() => {
    let mounted = true
    let hands: any
    let camera: any

    const initialize = async () => {
      try {
        // Dynamic imports to ensure client-side only
        const [Hands, Camera, DrawingUtils] = await Promise.all([
          import('@mediapipe/hands'),
          import('@mediapipe/camera_utils'),
          import('@mediapipe/drawing_utils')
        ])

        if (!mounted || !videoRef.current || !canvasRef.current) return

        hands = new Hands.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        await hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        hands.onResults((results: any) => {
          if (!mounted || !canvasRef.current) return

          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)

          if (results.multiHandLandmarks?.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
              DrawingUtils.drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2
              })
              DrawingUtils.drawLandmarks(ctx, landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 3
              })

              // Call gesture detection
              const gesture = interpretGesture(landmarks)
              if (gesture !== 'none') {
                onGesture(gesture)
              }
            }
          }
        })

        camera = new Camera.Camera(videoRef.current, {
          onFrame: async () => {
            if (hands && videoRef.current) {
              await hands.send({ image: videoRef.current })
            }
          },
          width: 320,
          height: 240
        })

        await camera.start()
        setIsDetecting(true)
        setIsInitialized(true)
        onReady()

      } catch (error) {
        console.error('MediaPipe initialization error:', error)
        onError(error instanceof Error ? error : new Error('Failed to initialize MediaPipe'))
      }
    }

    // Delay initialization to ensure DOM is ready
    setTimeout(initialize, 1000)

    return () => {
      mounted = false
      if (camera) camera.stop()
      if (hands) hands.close()
    }
  }, [onGesture, onReady, onError])

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-feed"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="gesture-canvas"
        width={320}
        height={240}
      />
      <div className="absolute inset-0 pointer-events-none">
        {!isInitialized && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm">Initializing detection...</div>
          </div>
        )}
        <div className="gesture-indicator">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isDetecting ? "bg-green-500" : "bg-yellow-500"
          )} />
          <span>
            {isDetecting ? "Detecting Gestures" : "Initializing..."}
          </span>
        </div>
      </div>
    </div>
  )
}

// Move gesture interpretation logic to a separate function
function interpretGesture(landmarks: any): string {
  // ...existing gesture interpretation logic...
  return 'none'
}
