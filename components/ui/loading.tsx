'use client'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export function Loading({ size = 'md', message, className = '' }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`
        animate-spin rounded-full border-b-2 border-blue-600
        ${sizes[size]}
      `} />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Loading size="lg" message={message} />
      </div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" message="Loading..." />
    </div>
  )
}
