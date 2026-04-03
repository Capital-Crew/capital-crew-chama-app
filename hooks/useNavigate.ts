'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useProgress } from "react-transition-progress";

export function useNavigate() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const startProgress = useProgress()

  function push(href: string) {
    startTransition(() => {
      startProgress() // Trigger the progress bar
      router.push(href)
    })
  }

  // Only use replace for post-write screens (success pages, post-login redirects)
  function replace(href: string) {
    startTransition(() => {
      startProgress()
      router.replace(href)
    })
  }

  function refresh() {
    startTransition(() => {
      startProgress()
      router.refresh()
    })
  }

  return { push, replace, refresh, isPending }
}
