import { type ReactNode, useEffect } from "react"
import { useShallow } from "zustand/shallow"
import type { PartialGateFlowOptions } from "./GateFlowOptions"
import { GateFlowContext, useGateFlowStore } from "./useGateFlow"
import { useGateFlowEvents } from "./useGateFlowEvents"
import { useNetworkStatus } from "./offline"

interface GateFlowProviderProps {
  /** GateFlow API base URL, e.g. "http://localhost:8080" */
  apiUrl: string
  /** Your GateFlow API key */
  apiKey: string
  /** Optional configuration overrides */
  options?: PartialGateFlowOptions
  /** App content to render once configured */
  children: ReactNode
  /** Optional callback invoked when SDK configuration fails */
  onConfigurationError?: (error: Error) => void
}

/**
 * @category Providers
 *
 * Main provider component for the GateFlow SDK.
 *
 * Initializes the GateFlow SDK with your API URL and key. Should wrap the root
 * of your application or the part requiring GateFlow functionality.
 *
 * @example
 * <GateFlowProvider apiUrl="https://api.gateflow.example.com" apiKey="your-api-key">
 *   <App />
 * </GateFlowProvider>
 */
export function GateFlowProvider({
  apiUrl,
  apiKey,
  options,
  children,
  onConfigurationError,
}: GateFlowProviderProps) {
  const { isConfigured, isLoading, configure, configurationError } = useGateFlowStore(
    useShallow((state) => ({
      isConfigured: state.isConfigured,
      isLoading: state.isLoading,
      configure: state.configure,
      configurationError: state.configurationError,
    })),
  )

  // Network status monitoring for offline fallback
  const isOnline = useNetworkStatus()
  const _setOnlineStatus = useGateFlowStore((state) => state._setOnlineStatus)

  // Sync network status to store (triggers retry when back online)
  useEffect(() => {
    _setOnlineStatus(isOnline)
  }, [isOnline, _setOnlineStatus])

  // Handle configuration events
  useGateFlowEvents({
    onConfigFail: (error) => {
      if (onConfigurationError) {
        onConfigurationError(new Error(error))
      }
    },
  })

  useEffect(() => {
    if (!isConfigured && !isLoading && !configurationError) {
      configure(apiUrl, apiKey, options)
    }
  }, [isConfigured, isLoading, configurationError, apiUrl, apiKey, options, configure])

  // Notify callback when configuration error changes
  useEffect(() => {
    if (configurationError && onConfigurationError) {
      onConfigurationError(new Error(configurationError))
    }
  }, [configurationError, onConfigurationError])

  useEffect(() => {
    const cleanup = useGateFlowStore.getState()._initListeners()
    return cleanup
  }, [])

  return <GateFlowContext.Provider value={true}>{children}</GateFlowContext.Provider>
}
