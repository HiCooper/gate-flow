import GateFlowExpoModule from "../GateFlowExpoModule";
const subscribers = new Map();
const bufferedEvents = [];
let nextSubscriberId = 1;
const isMatchingSubscriber = (subscriber, payload, replay) => {
    if (payload.handlerId == null) {
        return true;
    }
    if (replay) {
        return subscriber.handlerId === payload.handlerId;
    }
    return subscriber.handlerId == null || subscriber.handlerId === payload.handlerId;
};
const deliverToSubscriber = (subscriber, eventName, payload, replay = false) => {
    const callbacks = subscriber.getCallbacks();
    switch (eventName) {
        case "onConfigSuccess":
            callbacks.onConfigSuccess?.(payload.apiKey);
            return callbacks.onConfigSuccess != null;
        case "onConfigFail":
            callbacks.onConfigFail?.(payload.error);
            return callbacks.onConfigFail != null;
        case "onConfigRefresh":
            callbacks.onConfigRefresh?.(payload);
            return callbacks.onConfigRefresh != null;
        case "onUserIdentified":
            callbacks.onUserIdentified?.(payload.userId, payload.attributes);
            return callbacks.onUserIdentified != null;
        case "onUserReset":
            callbacks.onUserReset?.();
            return callbacks.onUserReset != null;
        case "onExperimentEvaluated": {
            if (!isMatchingSubscriber(subscriber, payload, replay))
                return false;
            const result = payload.result;
            callbacks.onExperimentEvaluated?.(payload.placementKey, result);
            // Convenience callbacks for specific result types
            if (result.type === "matched") {
                callbacks.onExperimentMatched?.(result.experiment);
            }
            else if (result.type === "holdout") {
                callbacks.onExperimentHoldout?.(result.experiment);
            }
            else if (result.type === "noMatch") {
                callbacks.onExperimentNoMatch?.();
            }
            else if (result.type === "error") {
                callbacks.onExperimentError?.(result.error);
            }
            return (callbacks.onExperimentEvaluated != null ||
                callbacks.onExperimentMatched != null ||
                callbacks.onExperimentHoldout != null ||
                callbacks.onExperimentNoMatch != null ||
                callbacks.onExperimentError != null);
        }
        case "onEventTracked":
            callbacks.onEventTracked?.(payload.eventType, payload.properties);
            return callbacks.onEventTracked != null;
        case "onUserAttributesUpdated":
            callbacks.onUserAttributesUpdated?.(payload.attributes);
            return callbacks.onUserAttributesUpdated != null;
        default:
            return false;
    }
};
const deliverLiveEvent = (eventName, payload) => {
    let delivered = false;
    for (const subscriber of subscribers.values()) {
        delivered = deliverToSubscriber(subscriber, eventName, payload) || delivered;
    }
    return delivered;
};
const deliverBufferedEvent = (bufferedEvent) => {
    for (const subscriber of subscribers.values()) {
        if (deliverToSubscriber(subscriber, bufferedEvent.eventName, bufferedEvent.payload, true)) {
            return true;
        }
    }
    return false;
};
const flushBufferedEvents = () => {
    for (let index = 0; index < bufferedEvents.length;) {
        if (deliverBufferedEvent(bufferedEvents[index])) {
            bufferedEvents.splice(index, 1);
            continue;
        }
        index += 1;
    }
};
const enqueueBufferedEvent = (eventName, payload) => {
    bufferedEvents.push({ eventName, payload });
};
const handleBufferedNativeEvent = (eventName, payload) => {
    if (!deliverLiveEvent(eventName, payload)) {
        enqueueBufferedEvent(eventName, payload);
    }
};
const handleImmediateNativeEvent = (eventName, payload) => {
    deliverLiveEvent(eventName, payload);
};
const installNativeListeners = () => {
    GateFlowExpoModule.addListener("onConfigSuccess", (payload) => {
        handleBufferedNativeEvent("onConfigSuccess", payload);
    });
    GateFlowExpoModule.addListener("onConfigFail", (payload) => {
        handleBufferedNativeEvent("onConfigFail", payload);
    });
    GateFlowExpoModule.addListener("onConfigRefresh", (payload) => {
        handleBufferedNativeEvent("onConfigRefresh", payload);
    });
    GateFlowExpoModule.addListener("onUserIdentified", (payload) => {
        handleBufferedNativeEvent("onUserIdentified", payload);
    });
    GateFlowExpoModule.addListener("onUserReset", (payload) => {
        handleBufferedNativeEvent("onUserReset", payload);
    });
    GateFlowExpoModule.addListener("onExperimentEvaluated", (payload) => {
        handleImmediateNativeEvent("onExperimentEvaluated", payload);
    });
    GateFlowExpoModule.addListener("onEventTracked", (payload) => {
        handleBufferedNativeEvent("onEventTracked", payload);
    });
    GateFlowExpoModule.addListener("onUserAttributesUpdated", (payload) => {
        handleBufferedNativeEvent("onUserAttributesUpdated", payload);
    });
};
installNativeListeners();
export const subscribeToGateFlowEvents = (handlerId, getCallbacks) => {
    const id = nextSubscriberId;
    nextSubscriberId += 1;
    subscribers.set(id, {
        id,
        handlerId,
        getCallbacks,
    });
    flushBufferedEvents();
    return () => {
        subscribers.delete(id);
    };
};
export const __resetGateFlowEventBridgeForTests = () => {
    subscribers.clear();
    bufferedEvents.splice(0, bufferedEvents.length);
    nextSubscriberId = 1;
};
//# sourceMappingURL=gateflowEventBridge.js.map