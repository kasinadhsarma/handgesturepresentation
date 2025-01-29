'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SlideViewerProps {
  id: string
  currentSlide: number
  totalSlides: number
}

export function SlideViewer({ id, currentSlide, totalSlides }: SlideViewerProps) {
  const [slideContent, setSlideContent] = useState<string>('')

  useEffect(() => {
    // TODO: Fetch slide content based on id and currentSlide
    setSlideContent(`Slide content for presentation ${id}, slide ${currentSlide + 1}`)
  }, [id, currentSlide])

  return (
    <motion.div
      className="bg-white w-full h-full shadow-2xl rounded-2xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-full flex flex-col p-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Slide {currentSlide + 1} <span className="text-gray-400">/ {totalSlides}</span>
          </h2>
          <span className="text-sm text-gray-400">Presentation ID: {id}</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-2xl text-gray-600 bg-gray-50/50 rounded-xl p-8">
          {slideContent}
        </div>
      </div>
    </motion.div>
  )
}

