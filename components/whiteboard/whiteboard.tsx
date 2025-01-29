'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import * as React from 'react'

interface WhiteboardProps {
  isDrawing: boolean
  currentTool: string
  currentColor: string
  brushSize: number
  onUndo?: (undoFn: () => void) => void
}

export function Whiteboard({ isDrawing, currentTool, currentColor, brushSize, onUndo }: WhiteboardProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([])
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 })
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [redoStack, setRedoStack] = useState<ImageData[]>([])

  const getContext = () => {
    const canvas = canvasRef.current
    return canvas?.getContext('2d')
  }

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const ctx = getContext()
      if (!ctx) return
      
      const currentImageData = drawingHistory[historyIndex]
      const newIndex = historyIndex - 1
      
      setRedoStack(prev => [...prev, currentImageData])
      setHistoryIndex(newIndex)
      ctx.putImageData(drawingHistory[newIndex], 0, 0)
    }
  }, [historyIndex, drawingHistory])

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const ctx = getContext()
      if (!ctx) return

      const redoAction = redoStack[redoStack.length - 1]
      setRedoStack(prev => prev.slice(0, -1))
      
      const newHistory = [...drawingHistory.slice(0, historyIndex + 1), redoAction]
      setDrawingHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      
      ctx.putImageData(redoAction, 0, 0)
    }
  }, [redoStack, drawingHistory, historyIndex])

  const saveToHistory = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    const newHistory = drawingHistory.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setDrawingHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setRedoStack([]) // Clear redo stack when new action is performed
  }, [drawingHistory, historyIndex])

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = currentColor
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        // Set highlighter properties
        if (currentTool === 'highlighter') {
          ctx.globalAlpha = 0.3
          ctx.globalCompositeOperation = 'multiply'
        } else {
          ctx.globalAlpha = 1
          ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over'
        }
      }
    }
  }, [currentColor, brushSize, currentTool])

  useEffect(() => {
    setIsVisible(isDrawing)
  }, [isDrawing])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        // Clear
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      } else if (e.key === 's' || e.key === 'S') {
        // Save
        // ...custom save logic...
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          redo() // Ctrl+Shift+Z for redo
        } else {
          undo() // Ctrl+Z for undo
        }
        e.preventDefault()
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        redo() // Ctrl+Y for redo
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [undo, redo])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        if (currentTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
        } else {
          ctx.globalCompositeOperation = 'source-over'
        }
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
        ctx.stroke()
      }
    }
  }

  const endDrawing = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.closePath()
        saveToHistory()
      }
    }
  }

  useEffect(() => {
    if (onUndo) {
      onUndo(undo)
    }
  }, [onUndo, undo])

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-10 touch-none"
      style={{
        cursor: isDrawing ? (currentTool === 'eraser' ? 'crosshair' : 'pointer') : 'default'
      }}
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  )
}
