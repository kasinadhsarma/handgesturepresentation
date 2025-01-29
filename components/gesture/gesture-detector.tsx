'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as handpose from '@tensorflow-models/handpose'
import '@tensorflow/tfjs-backend-webgl'
import '@/styles/gesture.css'
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import * as React from 'react'

interface GestureDetectorProps {
  onGesture: (gesture: string) => void
}

export function GestureDetector({ onGesture }: GestureDetectorProps): React.ReactElement {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [model, setModel] = useState<handpose.HandPose | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)

  // Initialize video stream with explicit dimensions
  useEffect(() => {
    let mounted = true

    async function setupCamera() {
      try {
        const constraints = {
          video: {
            width: 320,
            height: 240,
            facingMode: 'user',
            frameRate: { ideal: 30 }
          }
        }
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.width = 320
          videoRef.current.height = 240
          streamRef.current = mediaStream
          
          // Ensure video plays after loading
          await videoRef.current.play()
          setIsVideoReady(true)
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions.",
        })
      }
    }

    setupCamera()

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [toast]) // Add toast to dependency array

  // Handle video loaded
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoLoad = () => {
      if (video.readyState === 4) { // HAVE_ENOUGH_DATA
        setIsVideoReady(true)
      }
    }

    video.addEventListener('loadeddata', handleVideoLoad)
    video.addEventListener('playing', handleVideoLoad)
    
    return () => {
      video.removeEventListener('loadeddata', handleVideoLoad)
      video.removeEventListener('playing', handleVideoLoad)
    }
  }, [])

  // Load handpose model
  useEffect(() => {
    async function loadModel() {
      try {
        const loadedModel = await handpose.load()
        setModel(loadedModel)
        console.log('Handpose model loaded')
      } catch (error) {
        console.error('Error loading handpose model:', error)
      }
    }
    loadModel()
  }, [])

  const interpretGesture = useCallback((landmarks: number[][]): string => {
    // Simple gesture detection based on finger positions
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]

    // Calculate relative distances to make gestures more reliable
    const handSize = Math.hypot(
      landmarks[0][0] - landmarks[5][0],
      landmarks[0][1] - landmarks[5][1]
    )
    const threshold = handSize * 0.2 // 20% of hand size

    if (thumbTip[1] < indexTip[1] - threshold && thumbTip[1] < middleTip[1] - threshold) {
      console.log('Detected: next')
      return 'next'
    } else if (thumbTip[1] > indexTip[1] + threshold && thumbTip[1] > middleTip[1] + threshold) {
      console.log('Detected: previous')
      return 'previous'
    } else if (Math.abs(thumbTip[0] - indexTip[0]) < 20) {
      return 'click'
    }

    // New gesture detection logic
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]

    if (thumbTip[0] < indexTip[0] && thumbTip[0] < middleTip[0] && thumbTip[0] < ringTip[0] && thumbTip[0] < pinkyTip[0]) {
      return 'zoomIn'
    } else if (thumbTip[0] > indexTip[0] && thumbTip[0] > middleTip[0] && thumbTip[0] > ringTip[0] && thumbTip[0] > pinkyTip[0]) {
      return 'zoomOut'
    } else if (Math.abs(indexTip[0] - middleTip[0]) < 20 && Math.abs(middleTip[0] - ringTip[0]) < 20 && Math.abs(ringTip[0] - pinkyTip[0]) < 20) {
      return 'shape'
    }

    // Additional gesture detection logic
    if (Math.abs(indexTip[0] - middleTip[0]) < 20 && Math.abs(middleTip[0] - ringTip[0]) < 20 && Math.abs(ringTip[0] - pinkyTip[0]) < 20) {
      return 'pointer'
    } else if (Math.abs(indexTip[1] - middleTip[1]) < 20 && Math.abs(middleTip[1] - ringTip[1]) < 20 && Math.abs(ringTip[1] - pinkyTip[1]) < 20) {
      return 'highlight'
    } else if (thumbTip[1] < indexTip[1] && thumbTip[1] < middleTip[1] && thumbTip[1] < ringTip[1] && thumbTip[1] < pinkyTip[1]) {
      return 'stop'
    } else if (thumbTip[1] > indexTip[1] && thumbTip[1] > middleTip[1] && thumbTip[1] > ringTip[1] && thumbTip[1] > pinkyTip[1]) {
      return 'firstSlide'
    } else if (thumbTip[1] < indexTip[1] && thumbTip[1] < middleTip[1] && thumbTip[1] < ringTip[1] && thumbTip[1] < pinkyTip[1]) {
      return 'lastSlide'
    } else if (Math.abs(thumbTip[0] - indexTip[0]) < 20 && Math.abs(indexTip[0] - middleTip[0]) < 20 && Math.abs(middleTip[0] - ringTip[0]) < 20 && Math.abs(ringTip[0] - pinkyTip[0]) < 20) {
      return 'undo'
    } else if (Math.abs(thumbTip[0] - indexTip[0]) < 20 && Math.abs(indexTip[0] - middleTip[0]) < 20 && Math.abs(middleTip[0] - ringTip[0]) < 20 && Math.abs(ringTip[0] - pinkyTip[0]) < 20) {
      return 'redo'
    } else if (Math.abs(thumbTip[0] - indexTip[0]) < 20 && Math.abs(indexTip[0] - middleTip[0]) < 20 && Math.abs(middleTip[0] - ringTip[0]) < 20 && Math.abs(ringTip[0] - pinkyTip[0]) < 20) {
      return 'save'
    }

    return 'none'
  }, [])

  // Detect hands
  useEffect(() => {
    if (!model || !isVideoReady || !videoRef.current) return

    let isDetecting = true
    let animationFrameId: number

    const detectHands = async () => {
      if (!isDetecting || !videoRef.current || !model) return

      try {
        if (videoRef.current.readyState === 4) {
          const predictions = await model.estimateHands(videoRef.current)
          
          if (predictions.length > 0) {
            const gesture = interpretGesture(predictions[0].landmarks)
            
            if (gesture !== 'none') {
              console.log('Detected gesture:', gesture)
              onGesture(gesture)
            }
          }
        }

        if (isDetecting) {
          animationFrameId = requestAnimationFrame(detectHands)
        }
      } catch (error) {
        console.error('Error in hand detection:', error)
      }
    }

    detectHands()
    setIsDetecting(true)

    return () => {
      isDetecting = false
      setIsDetecting(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [model, onGesture, interpretGesture, isVideoReady])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      // ...existing cleanup...
    }
  }, [])

  return (
    <div className="relative">
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          playsInline
          muted
        />
        <div className="absolute inset-0 pointer-events-none">
          {/* Loading overlay */}
          {!isVideoReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm">Initializing camera...</div>
            </div>
          )}
          
          {/* Status indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isDetecting ? "bg-green-500" : "bg-yellow-500"
            )} />
            <span className="text-xs text-white font-medium">
              {isDetecting ? "Detecting Gestures" : "Initializing ML Model..."}
            </span>
          </div>
        </div>
      </div>

      {/* Quick gesture reference */}
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <span>👆</span>
          <span className="text-gray-600">Next</span>
        </div>
        <div className="flex items-center gap-1">
          <span>👇</span>
          <span className="text-gray-600">Previous</span>
        </div>
        <div className="flex items-center gap-1">
          <span>✌️</span>
          <span className="text-gray-600">Draw</span>
        </div>
        <div className="flex items-center gap-1">
          <span>✋</span>
          <span className="text-gray-600">Erase</span>
        </div>
      </div>
    </div>
  )
}


