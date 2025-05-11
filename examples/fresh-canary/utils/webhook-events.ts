// Utility functions for processing and storing webhook events

import { WorkOS } from '../../../src/workos.ts';
import { DenoCryptoProvider } from '../../../src/common/crypto/deno-crypto-provider.ts';
import type { Event } from '../../../src/common/interfaces/event.interface.ts';
import type { WebhookEvent } from './webhook-types.ts';

// Global events store (in-memory for the demo)
// In a production environment, you would use a database
const webhookEvents: WebhookEvent[] = [];

/**
 * Initialize WorkOS Webhooks
 * @returns WorkOS webhooks instance
 */
export function initWebhooks() {
  const cryptoProvider = new DenoCryptoProvider();

  return {
    webhooks: new WorkOS().webhooks,
  };
}

/**
 * Store a webhook event
 * @param event The verified webhook event
 * @param rawPayload The raw payload string
 * @param verified Whether the event signature was verified
 */
export function storeWebhookEvent(event: Event, rawPayload: string, verified: boolean) {
  webhookEvents.unshift({
    id: event.id,
    event: event.event,
    data: event.data,
    timestamp: event.createdAt,
    verified,
    rawPayload,
  });

  // Keep only the last 100 events (for demo purposes)
  if (webhookEvents.length > 100) {
    webhookEvents.pop();
  }
}

/**
 * Get all stored webhook events
 * @param options Filter options
 * @returns Filtered webhook events
 */
export function getWebhookEvents(options?: {
  eventType?: string;
  startTime?: string;
  endTime?: string;
}): WebhookEvent[] {
  let filteredEvents = [...webhookEvents];

  // Apply filters if provided
  if (options) {
    if (options.eventType) {
      filteredEvents = filteredEvents.filter(
        (event) => event.event === options.eventType,
      );
    }

    if (options.startTime) {
      const startTimestamp = new Date(options.startTime).getTime();
      filteredEvents = filteredEvents.filter(
        (event) => new Date(event.timestamp).getTime() >= startTimestamp,
      );
    }

    if (options.endTime) {
      const endTimestamp = new Date(options.endTime).getTime();
      filteredEvents = filteredEvents.filter(
        (event) => new Date(event.timestamp).getTime() <= endTimestamp,
      );
    }
  }

  return filteredEvents;
}

/**
 * Get all unique event types from stored events
 * @returns Array of unique event types
 */
export function getUniqueEventTypes(): string[] {
  const eventTypes = new Set<string>();

  webhookEvents.forEach((event) => {
    eventTypes.add(event.event);
  });

  return Array.from(eventTypes);
}
