"use client"

import { useEffect, useRef, useState } from "react"
import * as handpose from "@tensorflow-models/handpose"
import "@tensorflow/tfjs-backend-webgl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type HandLandmark, GestureProcessor } from "@/lib/gesture-processor"

interface AdvancedGestureControlsProps {
  onGestureDetected: (gesture: string, confidence: number, metadata?: any) => void
  isActive: boolean
  onActiveChange: (active: boolean) => void
}

export function AdvancedGestureControls({ onGestureDetected, isActive, onActiveChange }: AdvancedGestureControlsProps) {
  const [isHandposeLoaded, setIsHandposeLoaded] = useState(false)
  const [sensitivity, setSensitivity] = useState(0.7)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [useServerProcessing, setUseServerProcessing] = useState(false)
  const [gestureHistory, setGestureHistory] = useState<Array<{ gesture: string; timestamp: number }>>([])

  const wsRef = useRef<WebSocket | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handposeModelRef = useRef<handpose.HandPose | null>(null)
  const gestureProcessorRef = useRef<GestureProcessor | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastGestureTimeRef = useRef<number>(0)
  const gestureCooldown = 1000 // 1 second cooldown between gestures
  const gestureSequenceRef = useRef<Array<{ landmarks: HandLandmark[]; timestamp: number }>>([])

  // Initialize the handpose model and gesture processor
  useEffect(() => {
    async function initialize() {
      try {
        // Load handpose model
        handposeModelRef.current = await handpose.load()
        setIsHandposeLoaded(true)
        console.log("Handpose model loaded")

        // Initialize gesture processor
        gestureProcessorRef.current = new GestureProcessor(sensitivity)
        console.log("Gesture processor initialized")
      } catch (error) {
        console.error("Error initializing:", error)
      }
    }

    initialize()

    return () => {
      // Clean up
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [sensitivity])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isActive) return

    const clientId = "demo-user" // In a real app, this would be the user's ID
    wsRef.current = new WebSocket(`ws://localhost:8000/ws/gestures/${clientId}`)

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.gesture && data.confidence) {
        setDetectedGesture(data.gesture)
        setConfidence(data.confidence)
        onGestureDetected(data.gesture, data.confidence)
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isActive, onGestureDetected])

  // Start/stop webcam and send frames
  useEffect(() => {
    if (!isActive || !wsRef.current) return

    let animationFrameId: number

    async function setupCamera() {
      if (!videoRef.current || !canvasRef.current) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })
        videoRef.current.srcObject = stream

        return new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve()
          }
        })
      } catch (error) {
        console.error("Error accessing webcam:", error)
      }
    }

    async function sendFrame() {
      if (!videoRef.current || !canvasRef.current || !wsRef.current) return

      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      // Convert canvas to blob and send to server
      canvasRef.current.toBlob(
        (blob) => {
          if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(blob)
          }
        },
        "image/jpeg",
        0.8,
      )

      animationFrameId = requestAnimationFrame(sendFrame)
    }

    setupCamera().then(() => {
      if (videoRef.current) {
        videoRef.current.play()
        sendFrame()
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
  }, [isActive])

  // Process gesture locally using our gesture processor
  const processGestureLocally = async (landmarks: HandLandmark[]) => {
    if (!gestureProcessorRef.current) return

    const result = await gestureProcessorRef.current.recognizeGesture({
      landmarks,
      timestamp: Date.now(),
    })

    if (result.gesture && result.confidence > 0.7) {
      setDetectedGesture(result.gesture)
      setConfidence(result.confidence)
      lastGestureTimeRef.current = Date.now()

      // Add to history
      setGestureHistory((prev) => [
        { gesture: result.gesture as string, timestamp: Date.now() },
        ...prev.slice(0, 9), // Keep last 10 gestures
      ])

      // Notify parent component
      onGestureDetected(result.gesture, result.confidence, result.metadata)
    }
  }

  // Process complex gesture sequences on the server
  const processGestureSequenceOnServer = async () => {
    if (gestureSequenceRef.current.length < 2) return

    try {
      const response = await fetch("/api/gestures/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "demo-user", // In a real app, this would be the actual user ID
          gestureSequence: gestureSequenceRef.current,
        }),
      })

      const data = await response.json()

      if (data.success && data.recognized && data.confidence > 0.7) {
        setDetectedGesture(data.command.action)
        setConfidence(data.confidence)
        lastGestureTimeRef.current = Date.now()

        // Add to history
        setGestureHistory((prev) => [
          { gesture: data.command.action, timestamp: Date.now() },
          ...prev.slice(0, 9), // Keep last 10 gestures
        ])

        // Notify parent component
        onGestureDetected(data.command.action, data.confidence, data.command.parameters)
      }
    } catch (error) {
      console.error("Error processing gesture sequence on server:", error)
    }
  }

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Switch id="gesture-active" checked={isActive} onCheckedChange={onActiveChange} />
          <Label htmlFor="gesture-active">{isActive ? "Camera Active" : "Camera Inactive"}</Label>
        </div>

        {isActive && <div className="text-sm font-medium">{isHandposeLoaded ? "Model Ready" : "Loading Model..."}</div>}
      </div>

      {isActive && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="absolute w-full h-full object-cover opacity-0" playsInline />
            <canvas ref={canvasRef} className="absolute w-full h-full object-cover" />

            {detectedGesture && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                {detectedGesture} ({(confidence * 100).toFixed(0)}%)
              </div>
            )}
          </div>
        </Card>
      )}

      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="gestures">Gestures</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sensitivity">Sensitivity</Label>
              <span className="text-sm">{sensitivity.toFixed(1)}</span>
            </div>
            <Slider
              id="sensitivity"
              min={0.1}
              max={1.0}
              step={0.1}
              value={[sensitivity]}
              onValueChange={(value) => setSensitivity(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Higher sensitivity makes gesture detection more responsive but may increase false positives.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="server-processing" checked={useServerProcessing} onCheckedChange={setUseServerProcessing} />
            <div>
              <Label htmlFor="server-processing">Server Processing</Label>
              <p className="text-xs text-muted-foreground">
                Enable server-side processing for complex gesture recognition.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gestures">
          <div className="space-y-2">
            <h4 className="font-medium">Available Gestures:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Index finger up: Next slide</li>
              <li>• Pinky finger up: Previous slide</li>
              <li>• Index + Middle up: Toggle drawing mode</li>
              <li>• Hand open: Pointer mode</li>
              <li>• Thumb up: Erase drawing</li>
              <li>• Swipe left: First slide</li>
              <li>• Swipe right: Last slide</li>
              <li>• Pinch in/out: Zoom</li>
              <li>• Circle motion: Undo/Redo</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {gestureHistory.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {gestureHistory.map((item, index) => (
                <li key={index} className="text-sm flex justify-between">
                  <span className="font-medium">{item.gesture}</span>
                  <span className="text-muted-foreground">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No gestures detected yet.</p>
          )}
        </TabsContent>
      </Tabs>

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open("/api/gestures/library", "_blank")}
        >
          View Full Gesture Library
        </Button>
      </div>
    </div>
  )
}

