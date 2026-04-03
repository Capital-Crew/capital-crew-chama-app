import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FormError({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null
  return (
    <div 
      role="alert" 
      aria-live="polite" 
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="font-medium text-red-800">{message}</span>
    </div>
  )
}
