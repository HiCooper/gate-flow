/**
 * @file Network status monitoring for offline fallback.
 * Uses navigator.onLine to detect network connectivity.
 */

import { useEffect, useState } from "react"

const initialOnline =
  typeof navigator !== "undefined" ? navigator.onLine : true

/**
 * Hook to monitor network connectivity status.
 *
 * @returns Boolean indicating if the device is online
 *
 * @example
 * const isOnline = useNetworkStatus();
 * if (!isOnline) {
 *   console.log("Device is offline");
 * }
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(initialOnline)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Add event listeners for online/offline events
    // These are window events in browser, NetInfo events in React Native
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
    }

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  return isOnline
}

/**
 * Check if the device is currently online (non-React hook version).
 * Useful for non-component contexts.
 *
 * @returns Boolean indicating if the device is online
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") {
    // Server-side rendering or unknown environment
    return true
  }
  return navigator.onLine
}