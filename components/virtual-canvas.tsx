"use client"

import type React from "react"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

interface VirtualCanvasProps {
  className?: string
  color: string
  brushSize: number
  activeShape: string | null
  isDrawingEnabled: boolean
}

interface Point {
  x: number
  y: number
}

export const VirtualCanvas = forwardRef<HTMLCanvasElement, VirtualCanvasProps>(
  ({ className, color, brushSize, activeShape, isDrawingEnabled }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [lastPoint, setLastPoint] = useState<Point | null>(null)
    const [undoStack, setUndoStack] = useState<ImageData[]>([])
    const [redoStack, setRedoStack] = useState<ImageData[]>([])

    // Forward the canvas ref
    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement)

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size to match its display size
      const resizeCanvas = () => {
        const displayWidth = canvas.clientWidth
        const displayHeight = canvas.clientHeight

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth
          canvas.height = displayHeight
        }
      }

      resizeCanvas()
      window.addEventListener("resize", resizeCanvas)

      // Save initial canvas state
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setUndoStack([initialState])

      return () => {
        window.removeEventListener("resize", resizeCanvas)
      }
    }, [])

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Handle undo (Ctrl+Z)
        if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
          undo()
        }
        // Handle redo (Ctrl+Y or Ctrl+Shift+Z)
        else if (
          (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
          (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
        ) {
          redo()
        }
        // Handle save (S key)
        else if (e.key === "s") {
          saveCanvas()
        }
        // Handle clear (C key)
        else if (e.key === "c") {
          clearCanvas()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => {
        window.removeEventListener("keydown", handleKeyDown)
      }
    }, [])

    // Mouse and touch event handlers
    const startDrawing = (x: number, y: number) => {
      if (!isDrawingEnabled) return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      setIsDrawing(true)
      setLastPoint({ x, y })

      // Save current state before starting to draw
      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setUndoStack([...undoStack, currentState])
      setRedoStack([])

      if (activeShape) {
        // For shapes, we just save the starting point
        // We'll draw the shape on mouse up
      } else {
        // For freehand drawing, start at this point
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize
      }
    }

    const draw = (x: number, y: number) => {
      if (!isDrawingEnabled || !isDrawing || !lastPoint) return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (activeShape) {
        // For shapes, we continuously redraw the shape preview
        // Clear to the most recent state
        const lastState = undoStack[undoStack.length - 1]
        if (lastState) {
          ctx.putImageData(lastState, 0, 0)
        }

        // Draw shape preview
        drawShape(ctx, lastPoint.x, lastPoint.y, x, y, activeShape)
      } else {
        // For freehand drawing
        ctx.beginPath()
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      setLastPoint({ x, y })
    }

    const stopDrawing = (x: number, y: number) => {
      if (!isDrawingEnabled || !isDrawing || !lastPoint) {
        setIsDrawing(false)
        return
      }

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (activeShape) {
        // Finalize the shape
        drawShape(ctx, lastPoint.x, lastPoint.y, x, y, activeShape)
      }

      setIsDrawing(false)
      setLastPoint(null)
    }

    // Helper function to draw shapes
    const drawShape = (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      shape: string,
    ) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.fillStyle = color

      const width = endX - startX
      const height = endY - startY

      if (shape === "rectangle") {
        ctx.strokeRect(startX, startY, width, height)
      } else if (shape === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2
        const centerX = startX + width / 2
        const centerY = startY + height / 2

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (shape === "line") {
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      } else if (shape === "arrow") {
        // Draw the line
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Calculate the arrow head
        const angle = Math.atan2(endY - startY, endX - startX)
        const arrowSize = 15

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fill()
      }
    }

    // Canvas action functions
    const undo = () => {
      if (undoStack.length <= 1) return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const currentState = undoStack[undoStack.length - 1]
      const previousState = undoStack[undoStack.length - 2]

      if (previousState) {
        ctx.putImageData(previousState, 0, 0)
        setRedoStack([...redoStack, currentState])
        setUndoStack(undoStack.slice(0, -1))
      }
    }

    const redo = () => {
      if (redoStack.length === 0) return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const nextState = redoStack[redoStack.length - 1]

      if (nextState) {
        ctx.putImageData(nextState, 0, 0)
        setUndoStack([...undoStack, nextState])
        setRedoStack(redoStack.slice(0, -1))
      }
    }

    const clearCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Save current state before clearing
      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setUndoStack([...undoStack, currentState])
      setRedoStack([])

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const saveCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = "canvas-drawing.png"
      link.click()
    }

    // Event handler conversion helpers
    const getCoordinates = (
      e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent,
    ): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()

      if ("touches" in e) {
        // Touch event
        const touch = e.touches[0] || e.changedTouches[0]
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        }
      } else {
        // Mouse event
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
      }
    }

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      const { x, y } = getCoordinates(e)
      startDrawing(x, y)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      const { x, y } = getCoordinates(e)
      draw(x, y)
    }

    const handleMouseUp = (e: React.MouseEvent) => {
      const { x, y } = getCoordinates(e)
      stopDrawing(x, y)
    }

    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault()
      const { x, y } = getCoordinates(e)
      startDrawing(x, y)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault()
      const { x, y } = getCoordinates(e)
      draw(x, y)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
      const { x, y } = getCoordinates(e)
      stopDrawing(x, y)
    }

    return (
      <canvas
        ref={canvasRef}
        className={`${className} ${isDrawingEnabled ? "cursor-crosshair" : "pointer-events-none"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    )
  },
)

VirtualCanvas.displayName = "VirtualCanvas"

