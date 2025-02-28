'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { ToastType } from '@/hooks/use-toast'

interface ToastProviderProps {
  children: React.ReactNode
}

interface ToastOptions {
  duration?: number
  title?: string
  description?: string
  position?: 'top' | 'bottom'
}

interface Toast {
  id: string
  message: string
  type: ToastType
  title?: string
  description?: string
  duration: number
  position: 'top' | 'bottom'
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, options?: ToastOptions) => void
  dismissToast: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    options: ToastOptions = {}
  ) => {
    const id = Date.now().toString()
    const toast: Toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      position: options.position || 'bottom',
      title: options.title
    }

    setToasts((current) => [...current, toast])

    // Auto dismiss after duration (default 5 seconds)
    const duration = options.duration || 5000
    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }, [dismissToast])

    return (
    <ToastContext.Provider value={{ addToast, dismissToast, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
