'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import '@/styles/gesture.css'

export function HandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    requestCameraPermission()
  }, [])

  const requestCameraPermission = async () => {
    setIsLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setHasPermission(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
      toast({
        title: "Camera Access Denied",
        description: "Please grant camera permission to use hand gestures.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <p>Loading camera...</p>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <p className="text-red-500 mb-2">Camera access denied</p>
        <Button onClick={requestCameraPermission}>
          Request Camera Permission
        </Button>
      </div>
    )
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-feed mirror"
        width={320}
        height={240}
        autoPlay
        playsInline
        muted
      />
      <div className="absolute top-2 left-2 text-sm font-medium text-white bg-black/50 px-2 py-1 rounded-md">
        Camera Feed
      </div>
    </div>
  )
}

