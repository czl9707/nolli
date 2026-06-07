import { useEffect } from "react"
import { supabase } from "@/lib/data/supabase-client"
import { useAuthStore } from "@/stores/auth"

export function AuthSync() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    const cleanup = init()
    return cleanup
  }, [init])

  return null
}
