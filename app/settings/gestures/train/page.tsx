"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, Check, HandMetal, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function GestureTraining() {
  const [isRecording, setIsRecording] = useState(false)
  const [gestureName, setGestureName] = useState("")
  const [recordedFrames, setRecordedFrames] = useState<any[]>([])
  const [countdown, setCountdown] = useState(3)
  const [isSaving, setIsSaving] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    if (!gestureName) {
      toast({
        title: "Gesture name required",
        description: "Please enter a name for your gesture",
        variant: "destructive",
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Start countdown
        let count = 3
        const countdownInterval = setInterval(() => {
          setCountdown(count)
          count--
          if (count < 0) {
            clearInterval(countdownInterval)
            setIsRecording(true)
            startCapturingFrames(stream)
          }
        }, 1000)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record gestures",
        variant: "destructive",
      })
    }
  }

  const startCapturingFrames = (stream: MediaStream) => {
    const frames: any[] = []
    const startTime = Date.now()

    const captureFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return

      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      // Get frame data
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      frames.push({
        data: imageData,
        timestamp: Date.now() - startTime,
      })

      // Stop after 3 seconds
      if (Date.now() - startTime < 3000) {
        animationFrameRef.current = requestAnimationFrame(captureFrame)
      } else {
        stopRecording(frames)
      }
    }

    captureFrame()
  }

  const stopRecording = async (frames: any[]) => {
    setIsRecording(false)
    setRecordedFrames(frames)

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleSave = async () => {
    if (recordedFrames.length === 0) {
      toast({
        title: "No gesture recorded",
        description: "Please record a gesture before saving",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/gestures/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gestureName,
          trainingData: recordedFrames,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Gesture saved",
          description: "Your custom gesture has been saved and trained",
        })
        // Reset form
        setGestureName("")
        setRecordedFrames([])
      } else {
        throw new Error(data.message || "Failed to save gesture")
      }
    } catch (error) {
      console.error("Error saving gesture:", error)
      toast({
        title: "Save failed",
        description: "There was a problem saving your gesture",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings/gestures">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Train New Gesture</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record Gesture</CardTitle>
            <CardDescription>
              Record a new gesture by performing it in front of your camera. Each recording should be 3 seconds long.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gesture-name">Gesture Name</Label>
              <Input
                id="gesture-name"
                value={gestureName}
                onChange={(e) => setGestureName(e.target.value)}
                placeholder="e.g., Zoom In"
                disabled={isRecording}
              />
            </div>

            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
                width={640}
                height={480}
              />

              {!isRecording && countdown === 3 && !recordedFrames.length && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {countdown < 3 && !isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-6xl font-bold text-white">{countdown + 1}</span>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  <span className="animate-pulse w-3 h-3 rounded-full bg-white" />
                  Recording
                </div>
              )}

              {recordedFrames.length > 0 && !isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Check className="w-16 h-16 text-green-500" />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button onClick={startRecording} disabled={isRecording || !gestureName || isSaving}>
                {isRecording ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Record Gesture
                  </>
                )}
              </Button>

              <Button onClick={handleSave} disabled={recordedFrames.length === 0 || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Gesture
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Follow these steps to record a new gesture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Name your gesture</h3>
              <p className="text-sm text-gray-500">
                Choose a descriptive name for your gesture that reflects its intended action.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">2. Position yourself</h3>
              <p className="text-sm text-gray-500">
                Make sure your hand is clearly visible in the camera frame and well-lit.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">3. Perform the gesture</h3>
              <p className="text-sm text-gray-500">
                After clicking record, you&apos;ll have 3 seconds to perform your gesture. Try to be consistent and
                deliberate in your movement.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">4. Review and save</h3>
              <p className="text-sm text-gray-500">
                If you&apos;re satisfied with your recording, click Save to train the system on your new gesture.
              </p>
            </div>

            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2">
                <HandMetal className="w-5 h-5 text-primary" />
                <h4 className="font-medium">Tips for better recognition</h4>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-gray-500">
                <li>• Keep your movements clear and distinct</li>
                <li>• Maintain good lighting conditions</li>
                <li>• Avoid rapid or jerky movements</li>
                <li>• Record multiple variations for better accuracy</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

