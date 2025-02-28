'use client'

import { useEffect, useState } from 'react'

interface GestureVisualizationProps {
  gesture: string
}

export function GestureVisualization({ gesture }: GestureVisualizationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animation, setAnimation] = useState('')

  useEffect(() => {
    if (gesture) {
      setIsVisible(true)
      setAnimation('animate-in fade-in slide-in-from-top duration-300')
      
      const timer = setTimeout(() => {
        setAnimation('animate-out fade-out slide-out-to-top duration-300')
        setTimeout(() => setIsVisible(false), 300)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [gesture])

  if (!isVisible || !gesture) return null

  const getGestureEmoji = (gesture: string) => {
    switch (gesture) {
      case 'next':
        return '👆'
      case 'previous':
        return '👇'
      case 'draw':
      case 'click':
        return '✌️'
      case 'pointer':
        return '👊'
      case 'erase':
        return '🖐️'
      case 'highlight':
        return '✋'
      case 'stop':
        return '✋'
      case 'firstSlide':
        return '👈'
      case 'lastSlide':
        return '👉'
      case 'undo':
        return '↩️'
      case 'redo':
        return '↪️'
      case 'save':
        return '💾'
      case 'zoomIn':
        return '👌'
      case 'zoomOut':
        return '👌'
      case 'shapeCircle':
        return '⭕'
      default:
        return '🤚'
    }
  }

  const getGestureName = (gesture: string) => {
    return gesture.charAt(0).toUpperCase() + gesture.slice(1).replace(/([A-Z])/g, ' $1')
  }

  return (
    <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] ${animation}`}>
      <div className="bg-white/95 px-6 py-3 rounded-full shadow-xl backdrop-blur-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getGestureEmoji(gesture)}</span>
          <div className="h-8 w-px bg-gray-200" />
          <span className="text-lg font-medium text-gray-700">{getGestureName(gesture)}</span>
        </div>
      </div>
    </div>
  )
}
