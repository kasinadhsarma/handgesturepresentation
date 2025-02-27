'use client'

import { Button } from "@/components/ui/button"

interface ColorPickerProps {
  currentColor: string
  onColorChange: (color: string) => void
}

const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple', 'orange']

export function ColorPicker({ currentColor, onColorChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <Button
          key={color}
          size="sm"
          variant="outline"
          className="w-8 h-8 rounded-full p-0 overflow-hidden"
          style={{ backgroundColor: color }}
          onClick={() => onColorChange(color)}
        >
          {currentColor === color && (
            <div className="w-full h-full bg-white bg-opacity-30 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </Button>
      ))}
    </div>
  )
}

