'use client'

import { useRef, useEffect } from 'react'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // TODO: Implement drawing logic
        console.log('Canvas initialized')
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  )
}

