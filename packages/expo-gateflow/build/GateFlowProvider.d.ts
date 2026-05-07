import { type ReactNode } from "react";
import type { PartialGateFlowOptions } from "./GateFlowOptions";
interface GateFlowProviderProps {
    /** GateFlow API base URL, e.g. "http://localhost:8080" */
    apiUrl: string;
    /** Your GateFlow API key */
    apiKey: string;
    /** Optional configuration overrides */
    options?: PartialGateFlowOptions;
    /** App content to render once configured */
    children: ReactNode;
    /** Optional callback invoked when SDK configuration fails */
    onConfigurationError?: (error: Error) => void;
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
export declare function GateFlowProvider({ apiUrl, apiKey, options, children, onConfigurationError, }: GateFlowProviderProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=GateFlowProvider.d.ts.map