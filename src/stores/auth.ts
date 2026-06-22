import { create } from "zustand"

export const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === "true"

export type AuthUser = {
  id: number
  name: string
  email: string
  avatar: string
}

type MeResponse = {
  user: {
    id: number
    email: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  init: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

function mapUser(u: MeResponse["user"]): AuthUser {
  if (!u) return { id: 0, name: "", email: "", avatar: "" }
  return {
    id: u.id,
    name: u.display_name ?? "",
    email: u.email,
    avatar: u.avatar_url ?? "",
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    if (!AUTH_ENABLED) {
      set({ initialized: true })
      return
    }
    try {
      const resp = await fetch("/auth/me", { credentials: "same-origin" })
      if (resp.ok) {
        const data = (await resp.json()) as MeResponse
        set({ user: mapUser(data.user), initialized: true })
      } else {
        set({ user: null, initialized: true })
      }
    } catch {
      // Transient fetch failure (network blip, cold start) — don't freeze on Loading.
      set({ user: null, initialized: true })
    }
  },

  signIn: async () => {
    if (!AUTH_ENABLED) return
    set({ loading: true })
    // Full-page redirect; worker returns the user to "/" after callback.
    window.location.href = "/auth/login"
  },

  signOut: async () => {
    if (!AUTH_ENABLED) return
    await fetch("/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
    })
    set({ user: null })
  },
}))
