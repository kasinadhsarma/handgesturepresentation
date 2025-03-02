import { useToastContext } from '@/context/toast-provider'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default' | 'destructive'

export interface ToastProps {
  variant?: ToastType
  title?: string
  description: string
  duration?: number
  position?: 'top' | 'bottom'
}

export type ToastOptions = ToastProps

export function useToast() {
  const { addToast, dismissToast, toasts } = useToastContext()
  
  const toast = (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      return addToast({ description: options, variant: 'default' })
    }
    return addToast({
      ...options,
      variant: options.variant || 'default',
      description: options.description
    })
  }
  
  return {
    toast,
    dismiss: dismissToast,
    toasts,
  }
}
