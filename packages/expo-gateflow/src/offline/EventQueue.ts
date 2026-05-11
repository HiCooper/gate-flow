/**
 * @file Event queue for offline fallback.
 * Queues events when offline and automatically retries when back online.
 */

import type { GateFlowEvent } from "../GateFlowExpoModule.types"

// Storage key for event queue
const EVENT_QUEUE_KEY = "gateflow_event_queue"

/**
 * Maximum number of retries for a single event.
 */
const MAX_RETRY_COUNT = 3

/**
 * Maximum events to queue (prevents storage overflow).
 */
const MAX_QUEUE_SIZE = 100

/**
 * Queued event with metadata.
 */
export interface QueuedEvent {
  /** Unique ID for the queued event */
  id: string
  /** The actual event data */
  event: GateFlowEvent
  /** Number of retry attempts */
  retryCount: number
  /** When the event was queued */
  timestamp: number
}

/**
 * Get the event queue from localStorage.
 *
 * @returns Array of queued events
 */
function loadQueue(): QueuedEvent[] {
  try {
    const data = localStorage.getItem(EVENT_QUEUE_KEY)
    if (!data) {
      return []
    }
    return JSON.parse(data) as QueuedEvent[]
  } catch {
    return []
  }
}

/**
 * Save the event queue to localStorage.
 *
 * @param queue - Queue to save
 */
function saveQueue(queue: QueuedEvent[]): void {
  try {
    // Trim queue if too large
    const trimmed = queue.slice(-MAX_QUEUE_SIZE)
    localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.warn("[GateFlow] Failed to save event queue", error)
  }
}

/**
 * Generate a unique ID for a queued event.
 *
 * @returns UUID-like string
 */
function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 15)
  )
}

/**
 * Add an event to the queue.
 *
 * @param event - Event to queue
 * @returns Promise that resolves when enqueued
 *
 * @example
 * await enqueueEvent({
 *   eventType: 'page_view',
 *   userId: 'user123',
 *   properties: { page: 'home' }
 * });
 */
export async function enqueueEvent(event: GateFlowEvent): Promise<void> {
  const queue = loadQueue()

  // Check if queue is full
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn("[GateFlow] Event queue full, dropping oldest events")
    // Remove oldest events to make room
    queue.splice(0, queue.length - MAX_QUEUE_SIZE + 1)
  }

  const queued: QueuedEvent = {
    id: generateId(),
    event,
    retryCount: 0,
    timestamp: Date.now(),
  }

  queue.push(queued)
  saveQueue(queue)

  console.log(
    "[GateFlow] Event queued",
    event.eventType,
    "queue size:",
    queue.length,
  )
}

/**
 * Try to flush queued events to the server.
 *
 * @param apiUrl - API base URL
 * @returns True if all events were successfully flushed
 *
 * @example
 * const success = await flushEvents('https://api.example.com');
 * if (success) {
 *   console.log('All events flushed');
 * }
 */
export async function flushEvents(apiUrl: string): Promise<boolean> {
  const queue = loadQueue()
  if (queue.length === 0) {
    return true
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events: queue.map((q) => q.event) }),
    })

    if (!response.ok) {
      console.warn(
        "[GateFlow] Failed to flush events",
        response.status,
        response.statusText,
      )
      return false
    }

    // Clear queue on success
    saveQueue([])
    console.log("[GateFlow] Events flushed successfully", queue.length)
    return true
  } catch (error) {
    console.warn("[GateFlow] Failed to flush events", error)
    return false
  }
}

/**
 * Retry pending events with exponential backoff.
 * Call this when network comes back online.
 *
 * @param apiUrl - API base URL
 * @returns Promise that resolves when retry is complete
 *
 * @example
 * // When network comes back online
 * await retryPending('https://api.example.com');
 */
export async function retryPending(apiUrl: string): Promise<void> {
  const queue = loadQueue()
  if (queue.length === 0) {
    return
  }

  console.log("[GateFlow] Retrying pending events", queue.length)

  // Separate events that can be retried from those that exceeded max retries
  const retryable: QueuedEvent[] = []
  const discard: QueuedEvent[] = []

  for (const q of queue) {
    if (q.retryCount >= MAX_RETRY_COUNT) {
      discard.push(q)
    } else {
      retryable.push(q)
    }
  }

  if (discard.length > 0) {
    console.warn(
      "[GateFlow] Discarding",
      discard.length,
      "events after max retries",
    )
  }

  if (retryable.length === 0) {
    saveQueue([])
    return
  }

  // Increment retry count
  for (const q of retryable) {
    q.retryCount++
  }

  // Try to flush
  const success = await flushEvents(apiUrl)

  if (!success) {
    // Keep retryable events in queue for next attempt
    saveQueue(retryable)
    console.log(
      "[GateFlow] Retry failed, will retry later",
      retryable.length,
    )
  }
}

/**
 * Get the current queue size.
 *
 * @returns Number of queued events
 *
 * @example
 * const size = getQueueSize();
 * console.log('Queued events:', size);
 */
export function getQueueSize(): number {
  return loadQueue().length
}

/**
 * Clear all queued events.
 *
 * @returns Promise that resolves when cleared
 *
 * @example
 * await clearQueue();
 */
export async function clearQueue(): Promise<void> {
  saveQueue([])
  console.log("[GateFlow] Event queue cleared")
}