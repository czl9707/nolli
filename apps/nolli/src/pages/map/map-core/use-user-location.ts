import { useEffect, useState } from "react"

export type UserLocation = {
  longitude: number
  latitude: number
}

const POLL_INTERVAL = 10_000

export function useUserLocation(): UserLocation | null {
  const [location, setLocation] = useState<UserLocation | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return
    }

    let active = true

    const poll = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!active) return
          setLocation({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          })
        },
        // Leave the last known position in place on transient errors.
        () => {},
        { enableHighAccuracy: false, maximumAge: 5000, timeout: POLL_INTERVAL }
      )
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return location
}
