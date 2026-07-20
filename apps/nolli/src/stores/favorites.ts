import { create } from "zustand"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth"
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  UnauthorizedError,
} from "@/lib/api/favorites"

type FavoritesState = {
  ids: number[]
  loading: boolean
  pending: Set<number>
  load: () => Promise<void>
  toggle: (id: number) => Promise<void>
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  loading: false,
  pending: new Set(),

  load: async () => {
    set({ loading: true })
    try {
      const entries = await listFavorites()
      set({ ids: entries.map((e) => e.id) })
    } catch (err) {
      set({ ids: [] })
      toast.error("Couldn't load favorites")
    } finally {
      set({ loading: false })
    }
    
  },

  toggle: async (id: number) => {
    const { ids, pending } = get()
    if (pending.has(id)) return
    
    const isFav = ids.includes(id)
    // const next = isFav ? ids.filter((x) => x !== id) : [id, ...ids]
    // set({ ids: next })

    pending.add(id)

    try {
      if (isFav) {
        await removeFavorite(id);
        set((s) => ({ ids: s.ids.filter((i) => i !== id) }));
      }
      else {
        await addFavorite(id)
        set((s) => ({ ids: [...s.ids, id] }))
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        useAuthStore.setState({ user: null })
        toast.error("Session expired — please sign in again")
      } else {
        toast.error("Couldn't update favorites")
      }
    } finally {
      pending.delete(id);
    }
  },

  clear: () => {
    set({ ids: [], loading: false, pending: new Set() })
  },
}))

/**
 * React to auth: load on sign-in, clear on sign-out. Mirrors how filterStore
 * subscribes to the db store.
 */
useAuthStore.subscribe((state, prev) => {
  if (!prev.user && state.user) {
    void useFavoritesStore.getState().load()
  } else if (prev.user && !state.user) {
    useFavoritesStore.getState().clear()
  }
})
