"use client"

import { useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presetColors = [
    "#000000", // Black
    "#FFFFFF", // White
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
  ]

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-8 h-8 rounded border border-gray-300"
            style={{ backgroundColor: value }}
            aria-label="Select color"
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start" side="top">
          <div className="space-y-3">
            <HexColorPicker color={value} onChange={onChange} />
            <div className="flex flex-wrap gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color)
                    setIsOpen(false)
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <div className="text-xs font-mono">{value}</div>
    </div>
  )
}

