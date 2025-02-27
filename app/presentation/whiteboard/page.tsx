import { Canvas } from '@/components/whiteboard/canvas'
import { ColorPicker } from '@/components/whiteboard/color-picker'
import { ToolsPanel } from '@/components/whiteboard/tools-panel'
import { HandTracking } from '@/components/gesture/hand-tracking'
import { GestureDetector } from '@/components/gesture/gesture-detector'

export default function WhiteboardPage() {
  return (
    <div className="relative h-screen">
      <Canvas />
      <ColorPicker 
        currentColor="#000000" 
        onColorChange={(color) => console.log(color)} 
      />
      <ToolsPanel 
        currentTool="brush" 
        onToolChange={(tool) => console.log(tool)} 
        brushSize={5} 
        onBrushSizeChange={(size) => console.log(size)} 
      />
      <HandTracking />
      <GestureDetector onGesture={(gesture) => console.log(gesture)} />
    </div>
  )
}

