"use client"

import { Slider } from "@/components/ui/slider"

interface BrushSizeSelectorProps {
  value: number
  onChange: (size: number) => void
}

export function BrushSizeSelector({ value, onChange }: BrushSizeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 w-32">
      <Slider value={[value]} min={1} max={20} step={1} onValueChange={(vals) => onChange(vals[0])} />
      <span className="text-xs font-medium w-6 text-center">{value}px</span>
    </div>
  )
}

