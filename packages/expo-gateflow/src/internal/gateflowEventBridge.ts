import GateFlowExpoModule from "../GateFlowExpoModule"
import type { GateFlowEventCallbacks } from "../GateFlowEventCallbacks"
import type { ExperimentResult } from "../GateFlowExpoModule.types"

type NativeEventName =
  | "onConfigSuccess"
  | "onConfigFail"
  | "onConfigRefresh"
  | "onUserIdentified"
  | "onUserReset"
  | "onExperimentEvaluated"
  | "onEventTracked"
  | "onUserAttributesUpdated"

type BufferedEventName = Exclude<
  NativeEventName,
  // These are immediate-response events that should not be buffered
  "onExperimentEvaluated"
>

type Subscriber = {
  id: number
  handlerId?: string
  getCallbacks: () => GateFlowEventCallbacks
}

type BufferedEvent = {
  eventName: BufferedEventName
  payload: any
}

const subscribers = new Map<number, Subscriber>()
const bufferedEvents: BufferedEvent[] = []

let nextSubscriberId = 1

const isMatchingSubscriber = (
  subscriber: Subscriber,
  payload: { handlerId?: string },
  replay: boolean,
): boolean => {
  if (payload.handlerId == null) {
    return true
  }

  if (replay) {
    return subscriber.handlerId === payload.handlerId
  }

  return subscriber.handlerId == null || subscriber.handlerId === payload.handlerId
}

const deliverToSubscriber = (
  subscriber: Subscriber,
  eventName: NativeEventName,
  payload: any,
  replay = false,
): boolean => {
  const callbacks = subscriber.getCallbacks()

  switch (eventName) {
    case "onConfigSuccess":
      callbacks.onConfigSuccess?.(payload.apiKey)
      return callbacks.onConfigSuccess != null
    case "onConfigFail":
      callbacks.onConfigFail?.(payload.error)
      return callbacks.onConfigFail != null
    case "onConfigRefresh":
      callbacks.onConfigRefresh?.(payload)
      return callbacks.onConfigRefresh != null
    case "onUserIdentified":
      callbacks.onUserIdentified?.(payload.userId, payload.attributes)
      return callbacks.onUserIdentified != null
    case "onUserReset":
      callbacks.onUserReset?.()
      return callbacks.onUserReset != null
    case "onExperimentEvaluated": {
      if (!isMatchingSubscriber(subscriber, payload, replay)) return false

      const result: ExperimentResult = payload.result
      callbacks.onExperimentEvaluated?.(payload.placementKey, result)

      // Convenience callbacks for specific result types
      if (result.type === "matched") {
        callbacks.onExperimentMatched?.(result.experiment)
      } else if (result.type === "holdout") {
        callbacks.onExperimentHoldout?.(result.experiment)
      } else if (result.type === "noMatch") {
        callbacks.onExperimentNoMatch?.()
      } else if (result.type === "error") {
        callbacks.onExperimentError?.(result.error)
      }

      return (
        callbacks.onExperimentEvaluated != null ||
        callbacks.onExperimentMatched != null ||
        callbacks.onExperimentHoldout != null ||
        callbacks.onExperimentNoMatch != null ||
        callbacks.onExperimentError != null
      )
    }
    case "onEventTracked":
      callbacks.onEventTracked?.(payload.eventType, payload.properties)
      return callbacks.onEventTracked != null
    case "onUserAttributesUpdated":
      callbacks.onUserAttributesUpdated?.(payload.attributes)
      return callbacks.onUserAttributesUpdated != null
    default:
      return false
  }
}

const deliverLiveEvent = (eventName: NativeEventName, payload: any): boolean => {
  let delivered = false

  for (const subscriber of subscribers.values()) {
    delivered = deliverToSubscriber(subscriber, eventName, payload) || delivered
  }

  return delivered
}

const deliverBufferedEvent = (bufferedEvent: BufferedEvent): boolean => {
  for (const subscriber of subscribers.values()) {
    if (deliverToSubscriber(subscriber, bufferedEvent.eventName, bufferedEvent.payload, true)) {
      return true
    }
  }

  return false
}

const flushBufferedEvents = (): void => {
  for (let index = 0; index < bufferedEvents.length; ) {
    if (deliverBufferedEvent(bufferedEvents[index])) {
      bufferedEvents.splice(index, 1)
      continue
    }

    index += 1
  }
}

const enqueueBufferedEvent = (eventName: BufferedEventName, payload: any): void => {
  bufferedEvents.push({ eventName, payload })
}

const handleBufferedNativeEvent = (eventName: BufferedEventName, payload: any): void => {
  if (!deliverLiveEvent(eventName, payload)) {
    enqueueBufferedEvent(eventName, payload)
  }
}

const handleImmediateNativeEvent = (
  eventName: Exclude<NativeEventName, BufferedEventName>,
  payload: any,
): void => {
  deliverLiveEvent(eventName, payload)
}

const installNativeListeners = (): void => {
  GateFlowExpoModule.addListener("onConfigSuccess", (payload) => {
    handleBufferedNativeEvent("onConfigSuccess", payload)
  })
  GateFlowExpoModule.addListener("onConfigFail", (payload) => {
    handleBufferedNativeEvent("onConfigFail", payload)
  })
  GateFlowExpoModule.addListener("onConfigRefresh", (payload) => {
    handleBufferedNativeEvent("onConfigRefresh", payload)
  })
  GateFlowExpoModule.addListener("onUserIdentified", (payload) => {
    handleBufferedNativeEvent("onUserIdentified", payload)
  })
  GateFlowExpoModule.addListener("onUserReset", (payload) => {
    handleBufferedNativeEvent("onUserReset", payload)
  })
  GateFlowExpoModule.addListener("onExperimentEvaluated", (payload) => {
    handleImmediateNativeEvent("onExperimentEvaluated", payload)
  })
  GateFlowExpoModule.addListener("onEventTracked", (payload) => {
    handleBufferedNativeEvent("onEventTracked", payload)
  })
  GateFlowExpoModule.addListener("onUserAttributesUpdated", (payload) => {
    handleBufferedNativeEvent("onUserAttributesUpdated", payload)
  })
}

installNativeListeners()

export const subscribeToGateFlowEvents = (
  handlerId: string | undefined,
  getCallbacks: () => GateFlowEventCallbacks,
): (() => void) => {
  const id = nextSubscriberId
  nextSubscriberId += 1

  subscribers.set(id, {
    id,
    handlerId,
    getCallbacks,
  })
  flushBufferedEvents()

  return () => {
    subscribers.delete(id)
  }
}

export const __resetGateFlowEventBridgeForTests = (): void => {
  subscribers.clear()
  bufferedEvents.splice(0, bufferedEvents.length)
  nextSubscriberId = 1
}
