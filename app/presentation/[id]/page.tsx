"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Camera, Download, RotateCcw, RotateCw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { AdvancedGestureControls } from "@/components/advanced-gesture-controls"

const COLORS = [
  "#000000", // Black
  "#FF0000", // Red
  "#0000FF", // Blue
  "#00FF00", // Green
  "#FFFF00", // Yellow
  "#800080", // Purple
  "#FFA500", // Orange
]

const TOOLS = [
  { id: "draw", label: "Draw" },
  { id: "erase", label: "Erase" },
  { id: "highlight", label: "Highlight" },
  { id: "shapes", label: "Shapes" },
]

const SHAPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "circle", label: "Circle" },
  { id: "line", label: "Line" },
  { id: "triangle", label: "Triangle" },
  { id: "arrow", label: "Arrow" }
]

export default function PresentationView({ params }: { params: { id: string } }) {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [totalSlides, setTotalSlides] = useState(10)
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(5)
  const [isGestureActive, setIsGestureActive] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [scale, setScale] = useState(1)
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null)
  const [shapes, setShapes] = useState<Array<{type: string, points: number[], color: string}>>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{x: number, y: number} | null>(null)

  const handleGestureDetected = (gesture: string, confidence: number, metadata?: any) => {
    if (confidence < 0.7) return; // Ignore low confidence gestures

    switch (gesture) {
      case "nextSlide":
        if (currentSlide < totalSlides) {
          setCurrentSlide(currentSlide + 1);
        }
        break;
      case "previousSlide":
        if (currentSlide > 1) {
          setCurrentSlide(currentSlide - 1);
        }
        break;
      case "firstSlide":
        setCurrentSlide(1);
        break;
      case "lastSlide":
        setCurrentSlide(totalSlides);
        break;
      case "draw":
        setActiveTool("draw");
        break;
      case "erase":
        setActiveTool("erase");
        break;
      case "highlight":
        setActiveTool("highlight");
        break;
      case "shape":
        setActiveTool("shapes");
        break;
      case "pointer":
        setActiveTool(null);
        break;
      case "stop":
        setIsGestureActive(false);
        break;
      case "zoomIn":
      case "zoomOut":
        if (metadata?.scale) {
          handleZoom(metadata.scale);
        }
        break;
      case "undo":
        handleUndo();
        break;
      case "redo":
        handleRedo();
        break;
      case "save":
        handleSaveAnnotations();
        break;
    }
  }

  const handleZoom = (newScale: number) => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const scaleDiff = newScale / scale;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = canvas.width * scaleDiff;
        canvas.height = canvas.height * scaleDiff;
        ctx.scale(scaleDiff, scaleDiff);
        ctx.putImageData(imageData, 0, 0);
        
        setScale(newScale);
      }
    }
  }

  const loadPresentation = async () => {
    try {
      const response = await fetch(`/api/presentations/${params.id}`);
      if (!response.ok) throw new Error('Failed to load presentation');
      const data = await response.json();
      setTotalSlides(data.totalSlides);
      initCanvas();
    } catch (error) {
      console.error('Error loading presentation:', error);
    }
  }

  useEffect(() => {
    loadPresentation();
  }, [params.id]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setDrawHistory([]);
        setHistoryIndex(-1);
      }
    }
  }, [currentSlide]);

  const initCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        saveCanvasState()
      }
    }
  }

  const saveCanvasState = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
        setDrawHistory(prev => [...prev.slice(0, historyIndex + 1), imageData])
        setHistoryIndex(prev => prev + 1)
      }
    }
  }

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

    if (!lastPoint.current) {
      lastPoint.current = { x, y }
      return
    }

    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(x, y)
    ctx.strokeStyle = activeColor
    ctx.lineWidth = brushSize
    
    if (activeTool === 'highlight') {
      ctx.globalAlpha = 0.3
    } else {
      ctx.globalAlpha = 1
    }

    if (activeTool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }

    ctx.stroke()
    lastPoint.current = { x, y }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) {
        ctx.putImageData(drawHistory[historyIndex - 1], 0, 0)
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < drawHistory.length - 1) {
      setHistoryIndex(prev => prev + 1)
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) {
        ctx.putImageData(drawHistory[historyIndex + 1], 0, 0)
      }
    }
  }

  const drawShape = (type: string) => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const centerX = canvasRef.current.width / 2
    const centerY = canvasRef.current.height / 2
    
    ctx.beginPath()
    ctx.strokeStyle = activeColor
    ctx.lineWidth = brushSize
    ctx.fillStyle = activeColor

    switch (type) {
      case 'rectangle':
        ctx.rect(centerX - 50, centerY - 50, 100, 100)
        break
      case 'circle':
        ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI)
        break
      case 'line':
        ctx.moveTo(centerX - 50, centerY)
        ctx.lineTo(centerX + 50, centerY)
        break
      case 'triangle':
        ctx.moveTo(centerX, centerY - 50)
        ctx.lineTo(centerX - 50, centerY + 50)
        ctx.lineTo(centerX + 50, centerY + 50)
        ctx.closePath()
        break
      case 'arrow':
        // Arrow body
        ctx.moveTo(centerX - 50, centerY)
        ctx.lineTo(centerX + 30, centerY)
        // Arrow head
        ctx.moveTo(centerX + 30, centerY - 20)
        ctx.lineTo(centerX + 50, centerY)
        ctx.lineTo(centerX + 30, centerY + 20)
        break
    }

    ctx.stroke()
    if (type === 'triangle') {
      ctx.globalAlpha = 0.2
      ctx.fill()
      ctx.globalAlpha = 1
    }
    
    saveCanvasState()
  }

  const handleSaveAnnotations = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `slide-${currentSlide}-annotated.png`
      link.click()
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r p-4 space-y-6">
        {/* Colors */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Colors</h3>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-full border-2",
                  activeColor === color ? "border-primary" : "border-transparent",
                )}
                style={{ backgroundColor: color }}
                onClick={() => setActiveColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Tools</h3>
          <div className="space-y-1">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-md text-left",
                  activeTool === tool.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
                onClick={() => setActiveTool(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shapes Menu (only visible when shapes tool is active) */}
        {activeTool === 'shapes' && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Shapes</h3>
            <div className="space-y-1">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  className="w-full px-3 py-2 text-sm rounded-md text-left hover:bg-muted"
                  onClick={() => drawShape(shape.id)}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Brush Size */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">Brush Size</h3>
            <span className="text-sm text-muted-foreground">{brushSize}px</span>
          </div>
          <Slider value={[brushSize]} min={1} max={20} step={1} onValueChange={(value) => setBrushSize(value[0])} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Presentation #{params.id}</h1>
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {currentSlide} / {totalSlides} slides
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Slide Area */}
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="relative w-full max-w-5xl aspect-[16/9] bg-white shadow-lg">
            <img
              src={`/api/presentations/${params.id}/slides/${currentSlide}`}
              alt={`Slide ${currentSlide}`}
              className="w-full h-full object-cover"
              style={{ transform: `scale(${scale})` }}
            />
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full"
              onMouseDown={(e) => {
                setIsDrawing(true)
                lastPoint.current = null
                handleDraw(e)
              }}
              onMouseMove={handleDraw}
              onMouseUp={() => {
                setIsDrawing(false)
                lastPoint.current = null
                saveCanvasState()
              }}
              onMouseLeave={() => {
                setIsDrawing(false)
                lastPoint.current = null
              }}
              onTouchStart={(e) => {
                setIsDrawing(true)
                lastPoint.current = null
                handleDraw(e)
              }}
              onTouchMove={handleDraw}
              onTouchEnd={() => {
                setIsDrawing(false)
                lastPoint.current = null
                saveCanvasState()
              }}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="h-16 border-t bg-white flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-full border px-4 py-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentSlide(1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentSlide} / {totalSlides}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentSlide(totalSlides)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleUndo}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRedo}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSaveAnnotations}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-4">Hand Gesture Control</h3>
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              <Camera className="absolute inset-0 m-auto h-8 w-8 text-gray-400" />
            </div>
          </Card>
          <AdvancedGestureControls
            onGestureDetected={handleGestureDetected}
            isActive={isGestureActive}
            onActiveChange={setIsGestureActive}
          />
        </div>
      </div>
    </div>
  )
}
