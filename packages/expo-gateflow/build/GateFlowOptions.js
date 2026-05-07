/**
 * Default options for the GateFlow SDK.
 */
export const DefaultGateFlowOptions = {
    logging: {
        level: "info",
    },
    shouldPreload: false,
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes
    eventBatchSize: 10,
    eventFlushInterval: 5000, // 5 seconds
};
//# sourceMappingURL=GateFlowOptions.js.map