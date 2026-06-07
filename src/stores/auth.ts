import { create } from "zustand"
import { supabase } from "@/lib/data/supabase-client"

export type AuthUser = {
  id: string
  name: string
  email: string
  avatar: string
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  init: () => (() => void) | undefined
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

function mapUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  return {
    id: u.id,
    name: (u.user_metadata?.full_name as string) ?? (u.user_metadata?.name as string) ?? "",
    email: u.email ?? "",
    avatar: (u.user_metadata?.avatar_url as string) ?? "",
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user ? mapUser(session.user) : null,
        initialized: true,
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ? mapUser(session.user) : null,
        loading: false,
        initialized: true,
      })
    })

    return () => subscription.unsubscribe()
  },

  signIn: async () => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" })
    if (error) {
      set({ loading: false })
      return
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
