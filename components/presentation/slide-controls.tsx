'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SlideControlsProps {
  currentSlide: number
  totalSlides: number
  onPrevious: () => void
  onNext: () => void
}

export function SlideControls({ currentSlide, totalSlides, onPrevious, onNext }: SlideControlsProps) {
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={onPrevious}
        disabled={currentSlide === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="mx-2 text-sm font-medium">{currentSlide + 1} / {totalSlides}</span>
      <Button
        size="icon"
        variant="ghost"
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </>
  )
}

