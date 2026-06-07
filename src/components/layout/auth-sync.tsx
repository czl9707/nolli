import { useEffect } from "react"
import { useAuthStore, AUTH_ENABLED } from "@/stores/auth"

export function AuthSync() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    if (!AUTH_ENABLED) return
    const cleanup = init()
    return cleanup
  }, [init])

  return null
}
