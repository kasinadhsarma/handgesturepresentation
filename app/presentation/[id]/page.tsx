'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { use } from 'react'
import { SlideViewer } from '@/components/presentation/slide-viewer'
import { SlideControls } from '@/components/presentation/slide-controls'
import { GestureDetector } from '@/components/gesture/gesture-detector'
import { Whiteboard } from '@/components/whiteboard/whiteboard'
import { ColorPicker } from '@/components/whiteboard/color-picker'
import { ToolsPanel } from '@/components/whiteboard/tools-panel'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Save, RotateCcw, RotateCw } from 'lucide-react'

const GestureGuide = () => (
  <div className="fixed bottom-28 left-8 bg-white/95 p-5 rounded-xl shadow-xl backdrop-blur-sm z-50 border border-gray-100">
    <h3 className="font-bold mb-4 text-lg">Gesture Guide</h3>
    <ul className="text-sm space-y-3">
      <li className="flex items-center gap-3 text-gray-700">
        <span className="text-xl">👆</span>
        <span>Next slide</span>
      </li>
      <li className="flex items-center gap-3 text-gray-700">
        <span className="text-xl">👇</span>
        <span>Previous slide</span>
      </li>
      <li className="flex items-center gap-3 text-gray-700">
        <span className="text-xl">✌️</span>
        <span>Toggle drawing</span>
      </li>
    </ul>
  </div>
)

const SlideCounter = ({ current, total }: { current: number; total: number }) => (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] flex items-center gap-2">
    <div className="bg-white/95 px-4 py-2 rounded-full shadow-lg border border-gray-100 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-primary">{current + 1}</span>
        <div className="h-6 w-px bg-gray-200" />
        <span className="text-sm text-gray-500">{total} slides</span>
      </div>
    </div>
  </div>
)

export default function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [totalSlides, setTotalSlides] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState('pointer')
  const [currentColor, setCurrentColor] = useState('black')
  const [brushSize, setBrushSize] = useState(5)
  const { toast } = useToast()
  const undoRef = useRef<() => void>(() => {})

  useEffect(() => {
    const fetchPresentationData = async () => {
      try {
        // TODO: Fetch presentation data
        setTotalSlides(10)
      } catch (error) {
        console.error('Error fetching presentation:', error)
      }
    }

    if (resolvedParams?.id) {
      fetchPresentationData()
    }
  }, [resolvedParams?.id])

  const toggleDrawing = useCallback(() => {
    setIsDrawing((prev) => !prev)
    setCurrentTool((prev) => prev === 'pointer' ? 'brush' : 'pointer')
  }, [])

  const handleSave = useCallback(() => {
    toast({
      title: "Slide Saved",
      description: "Your current slide and annotations have been saved.",
    })
  }, [toast])

  const handleGesture = useCallback((gesture: string) => {
    console.log('Processing gesture:', gesture)
    
    switch (gesture) {
      case 'next':
        setCurrentSlide(prev => {
          const newSlide = Math.min(prev + 1, totalSlides - 1)
          console.log(`Moving to next slide: ${newSlide}`)
          return newSlide
        })
        toast({
          title: "Navigation",
          description: "Next slide",
        })
        break
      case 'previous':
        setCurrentSlide(prev => {
          const newSlide = Math.max(prev - 1, 0)
          console.log(`Moving to previous slide: ${newSlide}`)
          return newSlide
        })
        toast({
          title: "Navigation",
          description: "Previous slide",
        })
        break
      case 'click':
        toggleDrawing()
        break
      case 'pointer':
        setCurrentTool('pointer')
        setIsDrawing(false)
        break
      case 'draw':
        setCurrentTool('brush')
        setIsDrawing(true)
        break
      case 'erase':
        setCurrentTool('eraser')
        setIsDrawing(true)
        break
      case 'highlight':
        setCurrentTool('highlighter')
        setIsDrawing(true)
        break
      case 'stop':
        // TODO: Implement stop presentation logic
        break
      case 'firstSlide':
        setCurrentSlide(0)
        break
      case 'lastSlide':
        setCurrentSlide(totalSlides - 1)
        break
      case 'undo':
        undoRef.current()
        break
      case 'redo':
        // TODO: Implement redo logic
        break
      case 'save':
        handleSave()
        break
      case 'zoomIn':
        // Implement zoom in
        break
      case 'zoomOut':
        // Implement zoom out
        break
      case 'shapeCircle':
        // Switch to circle drawing mode
        break
      // ...other shape gestures...
    }
  }, [totalSlides, toast, handleSave, toggleDrawing])

  // Debug current slide changes
  useEffect(() => {
    console.log('Current slide:', currentSlide)
  }, [currentSlide])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Slide Counter */}
      <SlideCounter current={currentSlide} total={totalSlides} />

      {/* Main presentation area */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {/* Remove old debug info and add status bar */}
        <div className="fixed top-0 inset-x-0 h-12 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        
        <div className="relative w-full max-w-6xl h-[80vh] rounded-2xl overflow-hidden">
          {resolvedParams?.id && (
            <>
              <SlideViewer 
                id={resolvedParams.id} 
                currentSlide={currentSlide} 
                totalSlides={totalSlides} 
              />
              <Whiteboard
                isDrawing={isDrawing}
                currentTool={currentTool}
                currentColor={currentColor}
                brushSize={brushSize}
                onUndo={(undoFn: () => void) => { undoRef.current = undoFn }}
              />
            </>
          )}
        </div>
      </div>

      {/* Floating controls - always on top */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/95 rounded-full shadow-xl py-3 px-5 backdrop-blur-sm z-[60] border border-gray-100">
        <SlideControls
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onPrevious={() => handleGesture('previous')}
          onNext={() => handleGesture('next')}
        />
        <div className="h-8 w-px bg-gray-200 mx-3" />
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleDrawing} 
            className="hover:bg-gray-100 transition-colors"
          >
            {isDrawing ? <RotateCcw className="h-5 w-5" /> : <RotateCw className="h-5 w-5" />}
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => undoRef.current()} 
            aria-label="Undo" 
            className="hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleSave} 
            className="hover:bg-gray-100 transition-colors"
          >
            <Save className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Left sidebar with tools and gesture guide */}
      <div className="fixed top-8 left-8 flex flex-col gap-4 z-[60] w-[250px]">
        <div className="bg-white/95 p-5 rounded-xl shadow-xl backdrop-blur-sm border border-gray-100">
          <h3 className="font-medium mb-3 text-gray-700">Colors</h3>
          <ColorPicker currentColor={currentColor} onColorChange={setCurrentColor} />
        </div>
        <div className="bg-white/95 p-5 rounded-xl shadow-xl backdrop-blur-sm border border-gray-100">
          <h3 className="font-medium mb-3 text-gray-700">Tools</h3>
          <ToolsPanel
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
          />
        </div>
        <GestureGuide />
      </div>

      {/* Combined camera feed and gesture detection */}
      <div className="fixed top-8 right-8 z-[60] flex flex-col gap-4">
        <div className="bg-white/95 p-3 rounded-xl shadow-xl backdrop-blur-sm border border-gray-100">
          <h3 className="font-medium mb-2 text-gray-700 text-sm">Hand Gesture Control</h3>
          <GestureDetector onGesture={handleGesture} />
        </div>
      </div>
    </div>
  )
}

