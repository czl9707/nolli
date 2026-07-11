import { create } from "zustand"
import { type Role } from "@nolli/data"

export type AuthUser = {
  id: number
  name: string
  email: string
  avatar: string
  role: Role
}

type MeResponse = {
  user: {
    id: number
    email: string
    display_name: string | null
    avatar_url: string | null
    role: Role
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
  if (!u) return { id: 0, name: "", email: "", avatar: "", role: "user" }
  return {
    id: u.id,
    name: u.display_name ?? "",
    email: u.email,
    avatar: u.avatar_url ?? "",
    role: u.role,
  }
}

// Companion to the httpOnly session cookie: a readable "a session exists" flag
// set by the worker on login. Its absence means anonymous → skip the /auth/me
// round-trip entirely on page load.
const PRESENCE_COOKIE = "nolli_authed"

function hasPresence(): boolean {
  return document.cookie.includes(`${PRESENCE_COOKIE}=1`)
}

function clearPresence(): void {
  document.cookie = `${PRESENCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    // No session flag → anonymous; don't hit /auth/me.
    if (!hasPresence()) {
      set({ user: null, initialized: true })
      return
    }
    try {
      const resp = await fetch("/auth/me", { credentials: "same-origin" })
      if (resp.ok) {
        const data = (await resp.json()) as MeResponse
        set({ user: mapUser(data.user), initialized: true })
      } else {
        // Presence flag was stale (session expired/revoked elsewhere) — drop it.
        clearPresence()
        set({ user: null, initialized: true })
      }
    } catch {
      // Transient fetch failure (network blip, cold start) — don't freeze on Loading.
      set({ user: null, initialized: true })
    }
  },

  signIn: async () => {
    set({ loading: true })
    // Full-page redirect; worker returns the user to "/" after callback.
    window.location.href = "/auth/login/google"
  },

  signOut: async () => {
    await fetch("/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
    })
    set({ user: null })
  },
}))
