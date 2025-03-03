"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GestureControls } from "@/components/gesture-controls"
import { VirtualCanvas } from "@/components/virtual-canvas"
import { ColorPicker } from "@/components/color-picker"
import { BrushSizeSelector } from "@/components/brush-size-selector"
import { ShapeSelector } from "@/components/shape-selector"
import { PresentationControls } from "@/components/presentation-controls"
import { Separator } from "@/components/ui/separator"

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [totalSlides, setTotalSlides] = useState(5) // Demo has 5 slides
  const [activeColor, setActiveColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [activeShape, setActiveShape] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Demo slides
  const slides = Array.from({ length: totalSlides }, (_, i) => ({
    id: i + 1,
    imageUrl: `/placeholder.svg?height=720&width=1280&text=Demo Slide ${i + 1}`,
  }))

  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  const handleFirstSlide = () => {
    setCurrentSlide(1)
  }

  const handleLastSlide = () => {
    setCurrentSlide(totalSlides)
  }

  const handleToggleDrawing = () => {
    setIsDrawing(!isDrawing)
  }

  const handleSaveAnnotations = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `demo-slide-${currentSlide}-annotated.png`
      link.click()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="px-6 py-2 border-b bg-white">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Demo Presentation</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveAnnotations}>
              <Download className="h-4 w-4 mr-2" />
              Save Slide
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex">
        <div className="flex-1 flex flex-col relative">
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="bg-white/90 rounded-lg px-3 py-1.5 backdrop-blur-sm">
              Demo Mode: Slide {currentSlide} of {totalSlides}
            </div>

            <div className="flex items-center gap-2 bg-white/90 rounded-lg p-2 backdrop-blur-sm">
              <PresentationControls
                onNext={handleNextSlide}
                onPrevious={handlePrevSlide}
                onFirst={handleFirstSlide}
                onLast={handleLastSlide}
                currentSlide={currentSlide}
                totalSlides={totalSlides}
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 relative">
            <div className="relative w-full max-w-5xl aspect-[16/9] bg-white shadow-lg">
              <img
                src={slides[currentSlide - 1].imageUrl || "/placeholder.svg"}
                alt={`Slide ${currentSlide}`}
                className="w-full h-full object-cover"
              />

              <VirtualCanvas
                ref={canvasRef}
                className="absolute inset-0"
                color={activeColor}
                brushSize={brushSize}
                activeShape={activeShape}
                isDrawingEnabled={isDrawing}
              />
            </div>
          </div>

          {isDrawing && (
            <div className="bg-white border-t p-4">
              <div className="flex items-center gap-6 justify-center">
                <div>
                  <label className="text-sm font-medium block mb-2">Color</label>
                  <ColorPicker value={activeColor} onChange={setActiveColor} />
                </div>

                <Separator orientation="vertical" className="h-12" />

                <div>
                  <label className="text-sm font-medium block mb-2">Brush Size</label>
                  <BrushSizeSelector value={brushSize} onChange={setBrushSize} />
                </div>

                <Separator orientation="vertical" className="h-12" />

                <div>
                  <label className="text-sm font-medium block mb-2">Shapes</label>
                  <ShapeSelector activeShape={activeShape} onSelectShape={setActiveShape} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 border-l bg-white p-4">
          <h3 className="font-medium mb-4">Gesture Controls (Demo)</h3>
          <GestureControls
            onNext={handleNextSlide}
            onPrevious={handlePrevSlide}
            onToggleDrawing={handleToggleDrawing}
            isDrawing={isDrawing}
          />

          <div className="mt-8 p-4 bg-primary/10 rounded-lg">
            <h4 className="font-medium mb-2">Demo Instructions</h4>
            <p className="text-sm text-muted-foreground">
              This is a demo of the hand gesture controlled presentation. You can try out the gesture controls by
              enabling the camera, or use the on-screen controls to navigate and annotate.
              <br />
              <br />
              To see all features,{" "}
              <Link href="/register" className="text-primary underline">
                create an account
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

