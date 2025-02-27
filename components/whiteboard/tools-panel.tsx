'use client'

import { Button } from "@/components/ui/button"
import { MousePointer, Paintbrush, Eraser, Highlighter, Square } from 'lucide-react'
import { cn } from "@/lib/utils"

interface ToolsPanelProps {
  currentTool: string
  onToolChange: (tool: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
}

const tools = [
  { id: 'pointer', name: 'Pointer', icon: MousePointer },
  { id: 'brush', name: 'Draw', icon: Paintbrush },
  { id: 'eraser', name: 'Erase', icon: Eraser },
  { id: 'highlighter', name: 'Highlight', icon: Highlighter, 
    style: { opacity: 0.5, mixBlendMode: 'multiply' as const } },
  { id: 'shapes', name: 'Shapes', icon: Square },
]

export function ToolsPanel({ currentTool, onToolChange, brushSize, onBrushSizeChange }: ToolsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            size="sm"
            variant={currentTool === tool.id ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2 py-4 justify-start w-full",
              currentTool === tool.id && "bg-primary/10",
              tool.id === 'highlighter' && "hover:bg-yellow-50"
            )}
            onClick={() => onToolChange(tool.id)}
            style={tool.id === currentTool ? tool.style : undefined}
          >
            <tool.icon className="h-4 w-4" />
            <span className="text-sm">{tool.name}</span>
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <label htmlFor="brush-size" className="text-sm text-gray-600 flex items-center justify-between">
          Brush Size
          <span className="text-gray-400">{brushSize}px</span>
        </label>
        <input
          id="brush-size"
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Brush size"
        />
      </div>
    </div>
  )
}

