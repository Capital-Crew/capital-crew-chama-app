import { cn } from "@/lib/utils"

export function StepSkeleton() {
  return (
    <div className="skeleton-wrap p-6 space-y-4 animate-in fade-in duration-300" aria-hidden="true" aria-label="Loading next step">
      <div className="skeleton skeleton--title h-8 w-1/3 bg-slate-100 rounded-md" />
      <div className="skeleton skeleton--field h-12 w-full bg-slate-100 rounded-lg" />
      <div className="skeleton skeleton--field skeleton--field-short h-12 w-2/3 bg-slate-100 rounded-lg" />
      <div className="skeleton skeleton--field h-12 w-full bg-slate-100 rounded-lg" />
      <div className="skeleton skeleton--button h-11 w-32 bg-slate-100 rounded-lg mt-4" />
    </div>
  )
}
