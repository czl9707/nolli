import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth"

export function AuthSync() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  return null
}
