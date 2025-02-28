import { useToastContext } from '@/context/toast-provider'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  duration?: number
  title?: string
  description?: string
  position?: 'top' | 'bottom'
}

export function useToast() {
  const { addToast, dismissToast, toasts } = useToastContext()
  
  return {
    toast: addToast,
    dismiss: dismissToast,
    toasts,
  }
}
