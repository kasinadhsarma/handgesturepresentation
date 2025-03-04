"use client"

import { Circle, PenLineIcon as Line, Square } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ShapeSelectorProps {
  activeShape: string | null
  onSelectShape: (shape: string | null) => void
}

export function ShapeSelector({ activeShape, onSelectShape }: ShapeSelectorProps) {
  return (
    <ToggleGroup type="single" value={activeShape || ""} onValueChange={(value) => onSelectShape(value || null)}>
      <ToggleGroupItem value="line" aria-label="Line">
        <Line className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="rectangle" aria-label="Rectangle">
        <Square className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="circle" aria-label="Circle">
        <Circle className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

