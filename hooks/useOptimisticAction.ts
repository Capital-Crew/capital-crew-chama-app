'use client'
import { useOptimistic, useTransition, useState } from 'react'

type ActionResult = { success: boolean; error?: string }

type UseOptimisticActionReturn<T> = {
  optimisticValue: T
  isPending: boolean
  error: string | null
  execute: {
    (optimisticUpdate: T, action: () => Promise<ActionResult>): Promise<void>
    (action: () => Promise<ActionResult>, options?: { onOptimisticUpdate?: () => void }): Promise<void>
  }
}

/**
 * Enhanced Optimistic Action Hook
 * 
 * Supports both immediate value updates and callback-driven optimistic updates.
 */
export function useOptimisticAction<T>(
  initialValue?: T
): UseOptimisticActionReturn<T> {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // useOptimistic requires an initial state
  const [optimisticValue, setOptimisticValue] = useOptimistic(initialValue as T)

  async function execute(
    arg1: T | (() => Promise<ActionResult>),
    arg2?: (() => Promise<ActionResult>) | { onOptimisticUpdate?: () => void }
  ) {
    setError(null)

    // Pattern A: execute(action, { onOptimisticUpdate })
    // Pattern B: execute(optimisticValue, action)
    const isModernPattern = typeof arg1 === 'function';
    
    const action = (isModernPattern ? arg1 : arg2) as () => Promise<ActionResult>;
    const optimisticUpdate = isModernPattern ? undefined : (arg1 as T);
    const options = isModernPattern ? (arg2 as { onOptimisticUpdate?: () => void }) : undefined;

    if (!action || typeof action !== 'function') {
      console.error('[useOptimisticAction] No valid action function provided');
      return;
    }

    startTransition(async () => {
      // 1. Trigger Optimistic Update
      if (isModernPattern) {
        if (options?.onOptimisticUpdate) {
          options.onOptimisticUpdate();
        }
      } else if (optimisticUpdate !== undefined) {
        setOptimisticValue(optimisticUpdate);
      }

      // 2. Perform Server Action
      try {
        const result = await action()
        if (result && !result.success) {
          setError(result.error || 'Action failed. Please try again.')
        }
      } catch (err: any) {
        console.error('[useOptimisticAction] Execution error:', err);
        setError('Action failed. Please try again.')
      }
    })
  }

  return { 
    optimisticValue, 
    isPending, 
    error, 
    execute: execute as any 
  }
}
