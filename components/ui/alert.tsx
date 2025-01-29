import * as React from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

type AlertVariant = 'destructive' | 'success' | 'info' | 'warning'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const variantIcons = {
  destructive: AlertCircle,
  success: CheckCircle,
  info: Info,
  warning: XCircle,
} as const

export function Alert({ variant = 'info', className = '', children, ...props }: AlertProps) {
  const Icon = variantIcons[variant as keyof typeof variantIcons]

  return (
    <div className={cn(`alert alert-${variant}`, className)} {...props}>
      <div className="alert-icon">
        <Icon className="h-4 w-4" />
      </div>
      <div className="alert-content">{children}</div>
    </div>
  )
}

export function AlertDescription({
  children,
  className,
  ...props
}: AlertDescriptionProps): React.JSX.Element {
  return (
    <div className={cn("alert-description", className)} {...props}>
      {children}
    </div>
  );
}