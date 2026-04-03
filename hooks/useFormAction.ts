'use client'
import { useTransition, useState } from 'react'

type ActionResult<T> = {
  data?: T
  error?: string
  success: boolean
}

type UseFormActionReturn<T> = {
  isPending: boolean
  error: string | null
  execute: (action: (idempotencyKey?: string) => Promise<ActionResult<T>>, options?: { useIdempotency?: boolean }) => Promise<void>
  reset: () => void
}

export function useFormAction<T = void>(): UseFormActionReturn<T> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function execute(
    action: (idempotencyKey?: string) => Promise<ActionResult<T>>, 
    options?: { useIdempotency?: boolean }
  ) {
    if (isPending) return
    
    setError(null)
    const idempotencyKey = options?.useIdempotency ? crypto.randomUUID() : undefined
    
    startTransition(async () => {
      try {
        const result = await action(idempotencyKey)
        if (!result.success && result.error) {
          setError(result.error)
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Please try again.')
      }
    })
  }

  function reset() {
    setError(null)
  }

  return { isPending, error, execute, reset }
}
