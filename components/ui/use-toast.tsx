import { Toast as toastFn } from "./toast"

export function toast(props: { title: string; description: string }) {
  return toastFn(props)
}

export { useToast } from "./toast"
