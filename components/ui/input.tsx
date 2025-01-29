import * as React from 'react'
import { cn } from '@/lib/utils'
import { JSX } from 'react'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ' +
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ' +
          'focus:ring-offset-2',
        className
      )}
      {...props}
    />
  )
}