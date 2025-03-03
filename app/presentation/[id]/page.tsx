"use client"

import { useRef, useState } from "react"
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

export default function PresentationView({ params }: { params: { id: string } }) {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [totalSlides, setTotalSlides] = useState(10)
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(5)
  const [isGestureActive, setIsGestureActive] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleGestureDetected = (gesture: string, confidence: number) => {
    console.log(`Gesture detected: ${gesture} (${confidence.toFixed(2)})`)
    // Handle gesture actions
  }

  const handleNextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1)
    }
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

        {/* Brush Size */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">Brush Size</h3>
            <span className="text-sm text-muted-foreground">{brushSize}px</span>
          </div>
          <Slider value={[brushSize]} min={1} max={20} step={1} onValueChange={(value) => setBrushSize(value[0])} />
        </div>

        {/* Gesture Guide */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Gesture Guide</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded">👆</span>
              <span>Next slide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded">👈</span>
              <span>Previous slide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded">✌️</span>
              <span>Toggle drawing</span>
            </div>
          </div>
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
              src={`/placeholder.svg?height=720&width=1280&text=Slide ${currentSlide}`}
              alt={`Slide ${currentSlide}`}
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
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
          <Button variant="ghost" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
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

