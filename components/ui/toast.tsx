import * as React from 'react'
import { cn } from '@/lib/utils'
import { type ToastType } from '@/hooks/use-toast'

const styles = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  info: 'bg-blue-50 border-blue-500 text-blue-800'
}

interface ToastRootProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: ToastType
}

export function Toast({ 
  className,
  type = 'info',
  ...props 
}: ToastRootProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto relative rounded-lg border-l-4 p-4 shadow-lg transition-all',
        styles[type],
        className
      )}
      {...props}
    />
  )
}

export function ToastTitle({ 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'text-sm font-medium leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

export function ToastDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  )
}

export function ToastClose({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100',
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

export function ToastViewport({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
        className
      )}
      {...props}
    />
  )
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {children}
      <ToastViewport />
    </div>
  )
}
