'use client'
import { useOptimistic, useTransition, useState } from 'react'

type UseOptimisticActionReturn<T> = {
  optimisticValue: T
  isPending: boolean
  error: string | null
  execute: (
    optimisticUpdate: T,
    action: () => Promise<{ success: boolean; error?: string }>
  ) => Promise<void>
}

export function useOptimisticAction<T>(
  initialValue: T
): UseOptimisticActionReturn<T> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticValue, setOptimisticValue] = useOptimistic(initialValue)

  async function execute(
    optimisticUpdate: T,
    action: () => Promise<{ success: boolean; error?: string }>
  ) {
    setError(null)
    startTransition(async () => {
      // Immediately show the expected result — do not wait for the server
      setOptimisticValue(optimisticUpdate)
      try {
        const result = await action()
        if (!result.success) {
          // Server rejected with a curated message or status
          setError(result.error || 'Action failed. Please try again.')
        }
      } catch (err: any) {
        // Actual code execution crash (throw)
        setError('Action failed. Please try again.')
      }
    })
  }

  return { optimisticValue, isPending, error, execute }
}
