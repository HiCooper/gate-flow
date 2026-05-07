/**
 * Logging level for the GateFlow SDK.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "none";
/**
 * Logging options.
 */
export interface LoggingOptions {
    level: LogLevel;
}
/**
 * Full configuration options for the GateFlow SDK.
 */
export interface GateFlowOptions {
    /** Logging configuration */
    logging: LoggingOptions;
    /** Whether to preload experiments on configure */
    shouldPreload: boolean;
    /** Whether to enable local experiment caching */
    cacheEnabled: boolean;
    /** Cache TTL in seconds */
    cacheTTL: number;
    /** Number of events to batch before flushing */
    eventBatchSize: number;
    /** Interval in ms between automatic event flushes */
    eventFlushInterval: number;
}
/**
 * Deep partial version of GateFlowOptions for user-provided overrides.
 */
export interface PartialGateFlowOptions {
    logging?: Partial<LoggingOptions>;
    shouldPreload?: boolean;
    cacheEnabled?: boolean;
    cacheTTL?: number;
    eventBatchSize?: number;
    eventFlushInterval?: number;
}
/**
 * Default options for the GateFlow SDK.
 */
export declare const DefaultGateFlowOptions: GateFlowOptions;
//# sourceMappingURL=GateFlowOptions.d.ts.map