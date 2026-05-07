import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { GateFlowContext, useGateFlowStore } from "./useGateFlow";
import { useGateFlowEvents } from "./useGateFlowEvents";
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
export function GateFlowProvider({ apiUrl, apiKey, options, children, onConfigurationError, }) {
    const { isConfigured, isLoading, configure, configurationError } = useGateFlowStore(useShallow((state) => ({
        isConfigured: state.isConfigured,
        isLoading: state.isLoading,
        configure: state.configure,
        configurationError: state.configurationError,
    })));
    // Handle configuration events
    useGateFlowEvents({
        onConfigFail: (error) => {
            if (onConfigurationError) {
                onConfigurationError(new Error(error));
            }
        },
    });
    useEffect(() => {
        if (!isConfigured && !isLoading && !configurationError) {
            configure(apiUrl, apiKey, options);
        }
    }, [isConfigured, isLoading, configurationError, apiUrl, apiKey, options, configure]);
    // Notify callback when configuration error changes
    useEffect(() => {
        if (configurationError && onConfigurationError) {
            onConfigurationError(new Error(configurationError));
        }
    }, [configurationError, onConfigurationError]);
    useEffect(() => {
        const cleanup = useGateFlowStore.getState()._initListeners();
        return cleanup;
    }, []);
    return <GateFlowContext.Provider value={true}>{children}</GateFlowContext.Provider>;
}
//# sourceMappingURL=GateFlowProvider.js.map