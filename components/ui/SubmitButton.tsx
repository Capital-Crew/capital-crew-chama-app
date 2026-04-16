'use client'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

type SubmitButtonProps = {
  isPending: boolean
  label: string          // default label e.g. "Submit"
  pendingLabel: string   // label while waiting e.g. "Submitting..."
  variant?: 'primary' | 'danger' | 'warning' | 'success'
  disabled?: boolean
  name?: string
  value?: string
  onClick?: () => void
  className?: string
}

export function SubmitButton({
  isPending,
  label,
  pendingLabel,
  variant = 'primary',
  disabled,
  name,
  value,
  onClick,
  className,
}: SubmitButtonProps) {
  // Map variants to Tailwind classes to match existing UI
  const variantClasses = {
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  }

  return (
    <button
      onClick={onClick}
      name={name}
      value={value}
      disabled={isPending || disabled}
      aria-busy={isPending}
      aria-label={isPending ? pendingLabel : label}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none w-full md:w-auto",
        variantClasses[variant],
        isPending && "bg-slate-100 text-slate-400 cursor-wait shadow-none",
        className
      )}
    >
      {isPending && <Spinner className="w-4 h-4" />}
      {isPending ? pendingLabel : label}
    </button>
  )
}
