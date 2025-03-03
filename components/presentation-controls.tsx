"use client"

import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PresentationControlsProps {
  onNext: () => void
  onPrevious: () => void
  onFirst: () => void
  onLast: () => void
  currentSlide: number
  totalSlides: number
}

export function PresentationControls({
  onNext,
  onPrevious,
  onFirst,
  onLast,
  currentSlide,
  totalSlides,
}: PresentationControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onFirst} disabled={currentSlide === 1}>
        <ChevronsLeft className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onPrevious} disabled={currentSlide === 1}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onNext} disabled={currentSlide === totalSlides}>
        <ChevronRight className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onLast} disabled={currentSlide === totalSlides}>
        <ChevronsRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

