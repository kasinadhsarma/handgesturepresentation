'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import '@/styles/gesture.css'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import * as React from 'react'
import Image from 'next/image'

interface GestureDetectorProps {
  onGesture: (gesture: string, coords?: [number, number]) => void
  presentationId: string
}

export function GestureDetector({ onGesture, presentationId }: GestureDetectorProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [currentMode, setCurrentMode] = useState<string>("presentation")
  const frameIntervalRef = useRef<number>(1000 / 30) // 30 fps
  const lastFrameTimeRef = useRef<number>(0)
  const [vizFrameSrc, setVizFrameSrc] = useState<string>("/placeholder-viz.png")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const memoizedOnGesture = useCallback(onGesture, [onGesture])
  
  useEffect(() => {
    if (!isClient) return
    
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout
    let heartbeatTimeout: NodeJS.Timeout
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10
    const baseDelay = 1000
    const maxDelay = 8000
    const heartbeatInterval = 3000

    const handleHeartbeat = () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      try {
        ws.send(JSON.stringify({ type: 'heartbeat' }))
        heartbeatTimeout = setTimeout(handleHeartbeat, heartbeatInterval)
      } catch (e) {
        console.error('Failed to send heartbeat:', e)
      }
    }

    const connect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        toast('Could not establish connection to gesture detection service after multiple attempts.', 'error')
        setIsDetecting(false)
        return
      }

      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch (e) {
          console.error('Error closing existing connection:', e)
        }
        wsRef.current = null
      }

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.hostname
        const port = window.location.hostname === 'localhost' ? ':8000' : ''
        const wsUrl = `${protocol}//${host}${port}/ws/gesture_control/${presentationId}`

        ws = new WebSocket(wsUrl)
        
        if ('binaryType' in ws) {
          ws.binaryType = 'arraybuffer'
        }

        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState !== WebSocket.OPEN) {
            console.log('Connection timeout - retrying...')
            try {
              ws.close()
            } catch (e) {
              console.error('Error closing WebSocket:', e)
            }
            reconnectAttempts++
            connect()
          }
        }, 5000)

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          setIsDetecting(true)
          reconnectAttempts = 0
          handleHeartbeat()
          
          setTimeout(() => {
            try {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'hello', client: 'web' }))
              }
            } catch (e) {
              console.error('Failed to send initial message:', e)
            }
          }, 500)
        }

        ws.onclose = () => {
          setIsDetecting(false)
          clearTimeout(heartbeatTimeout)

          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(baseDelay * Math.pow(1.5, reconnectAttempts), maxDelay)
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++
              connect()
            }, delay)
          }
        }

        ws.onerror = () => {
          console.error('WebSocket error occurred')
        }

        ws.onmessage = (event: MessageEvent) => {
          try {
            if (event.data === "ping") {
              try {
                if (ws && ws.readyState === WebSocket.OPEN) {
                  ws.send("pong")
                }
                return
              } catch (e) {
                console.error('Failed to respond to ping:', e)
                return
              }
            }

            const response = JSON.parse(event.data)

        if (response.type === 'error') {
          console.error('Server error:', response.message)
          toast(response.message, 'error')
          return
        }

            if (response.type === 'heartbeat') return

            if (response.viz_frame) {
              const frameSrc = `data:image/jpeg;base64,${response.viz_frame}`
              setVizFrameSrc((prev) => (prev !== frameSrc ? frameSrc : prev))
            }

            if (response.current_mode && response.current_mode !== currentMode) {
              setCurrentMode(response.current_mode)
            }

            if (response.gesture && response.gesture !== 'none') {
              if (response.coordinates) {
                memoizedOnGesture(response.gesture, response.coordinates)
              } else {
                memoizedOnGesture(response.gesture)
              }

              if (response.message) {
              toast(
                isDetecting ? `${response.gesture}: ${response.message}` : "Gesture detection is not active - check connection",
                isDetecting ? 'info' : 'warning'
              )
              }
            }
          } catch (error) {
            console.error('Error parsing gesture response:', error)
          }
        }

        wsRef.current = ws
      } catch (error) {
        console.error('Error creating WebSocket:', error)
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++
          connect()
        }, baseDelay)
      }
    }

    const initialConnectionTimeout = setTimeout(() => {
      connect()
    }, 2000)

    return () => {
      clearTimeout(initialConnectionTimeout)
      clearTimeout(reconnectTimeout)
      clearTimeout(heartbeatTimeout)
      if (ws) {
        try {
          ws.close()
        } catch (e) {
          console.error('Error during cleanup:', e)
        }
      }
    }
  }, [presentationId, toast, memoizedOnGesture, currentMode, isDetecting, isClient])

  useEffect(() => {
    if (!isClient) return
    
    let mounted = true
    let retryCount = 0
    const maxRetries = 3

    async function setupCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        const constraints = {
          video: {
            width: 320,
            height: 240,
            facingMode: 'user',
            frameRate: { ideal: 30 },
          },
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop())
          return
        }

        if (videoRef.current) {
          const videoElement = videoRef.current
          videoElement.srcObject = null
          
          videoElement.srcObject = mediaStream
          videoElement.width = 320
          videoElement.height = 240
          streamRef.current = mediaStream

          try {
            await videoElement.play()
            setIsVideoReady(true)
          } catch (playError) {
            if (retryCount < maxRetries) {
              retryCount++
              setTimeout(setupCamera, 1000)
            } else {
              console.error('Failed to play video after retries:', playError)
              toast('Could not play camera stream. Please refresh the page.', 'error')
            }
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        toast('Could not access camera. Please check permissions.', 'error')
      }
    }

    const cameraSetupTimeout = setTimeout(() => {
      setupCamera()
    }, 1000)

    return () => {
      mounted = false
      clearTimeout(cameraSetupTimeout)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [toast, isClient])

  const processVideoFrame = useCallback(async () => {
    if (
      !isClient ||
      !videoRef.current ||
      !canvasRef.current ||
      !isVideoReady ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return

    const currentTime = performance.now()
    const timeSinceLastFrame = currentTime - lastFrameTimeRef.current

    if (timeSinceLastFrame < frameIntervalRef.current) return

    lastFrameTimeRef.current = currentTime

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) return

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size < 1000) return
          
          const reader = new FileReader()
          reader.onload = async (e) => {
            if (e.target?.result && wsRef.current?.readyState === WebSocket.OPEN) {
              try {
                wsRef.current.send(e.target.result)
              } catch (error) {
                console.error('Error sending frame:', error)
              }
            }
          }
          reader.readAsArrayBuffer(blob)
        },
        'image/jpeg',
        0.6
      )
    } catch (error) {
      console.error('Error in processVideoFrame:', error)
    }
  }, [isVideoReady, isClient])

  useEffect(() => {
    if (!isClient || !isVideoReady || !videoRef.current) return

    let isDetecting = true
    let animationFrameId: number

    const detectGestures = async () => {
      if (!isDetecting || !videoRef.current) return

      try {
        await processVideoFrame()
        animationFrameId = requestAnimationFrame(detectGestures)
      } catch (error) {
        console.error('Error in gesture detection:', error)
      }
    }

    detectGestures()

    return () => {
      isDetecting = false
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isVideoReady, processVideoFrame, isClient])

  if (!isClient) {
    return <div className="min-h-[400px] bg-gray-100 rounded-lg" />
  }

  return (
    <div className="relative">
      <div className="video-container relative">
        <div className="flex flex-row gap-2">
          <div className="relative">
            <video
              ref={videoRef}
              className="video-feed rounded-lg"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="absolute inset-0 pointer-events-none">
              {!isVideoReady && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-sm">Initializing camera...</div>
                </div>
              )}

              <div
                className={cn(
                  "absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium text-white",
                  currentMode === "presentation" ? "bg-blue-500" : "bg-green-500"
                )}
              >
                {currentMode === "presentation" ? "Presentation" : "Annotation"}
              </div>

              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors duration-200",
                    isDetecting ? "bg-green-500" : "bg-yellow-500"
                  )}
                />
                <span className="text-xs text-white font-medium">
                  {isDetecting ? "Detecting" : "Connecting..."}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative w-[320px] h-[240px]">
              <Image
                src={vizFrameSrc}
                alt="Gesture visualization"
                className="viz-frame rounded-lg"
                fill
                sizes="320px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-xs font-medium text-white">
              Gesture Visualization
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-white/90 rounded-lg p-2 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="col-span-2">
            <h4 className="font-medium text-gray-700 mb-1">Navigation</h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">👆</span>
                <span className="text-gray-600">Next slide</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">👇</span>
                <span className="text-gray-600">Previous slide</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">☝️</span>
                <span className="text-gray-600">First slide</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✋</span>
                <span className="text-gray-600">Last slide</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 mt-2">
            <h4 className="font-medium text-gray-700 mb-1">Drawing Tools</h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">✌️</span>
                <span className="text-gray-600">Draw mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤚</span>
                <span className="text-gray-600">Erase mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">👈</span>
                <span className="text-gray-600">Pointer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✍️</span>
                <span className="text-gray-600">Highlight</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 mt-2">
            <h4 className="font-medium text-gray-700 mb-1">Actions</h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">↩️</span>
                <span className="text-gray-600">Undo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">↪️</span>
                <span className="text-gray-600">Redo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✊</span>
                <span className="text-gray-600">Save</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤚</span>
                <span className="text-gray-600">Stop</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
