/**
 * Event Bus - Event Dispatcher and Handler Registry
 * 
 * Coordinates the flow of domain events from services to handlers.
 * Supports multiple handlers per event type for side effects.
 * 
 * Pattern: Publish-Subscribe
 */

import { EventStoreService, type DomainEvent } from '@/services/event-store-service'
import type { DomainEventType } from '@prisma/client'

// ========================================
// TYPES
// ========================================

export type EventHandler = (event: DomainEvent & { id: string; timestamp: Date }) => Promise<void>

// ========================================
// EVENT BUS
// ========================================

class EventBusClass {
    private handlers = new Map<DomainEventType, EventHandler[]>()

    /**
     * Register an event handler
     * 
     * Multiple handlers can be registered for the same event type.
     * They execute in registration order.
     */
    on(eventType: DomainEventType, handler: EventHandler) {
        const existing = this.handlers.get(eventType) || []
        this.handlers.set(eventType, [...existing, handler])
    }

    /**
     * Register multiple handlers at once
     */
    registerHandlers(handlers: Record<DomainEventType, EventHandler | EventHandler[]>) {
        for (const [eventType, handler] of Object.entries(handlers)) {
            const handlerArray = Array.isArray(handler) ? handler : [handler]
            handlerArray.forEach(h => this.on(eventType as DomainEventType, h))
        }
    }

    /**
     * Emit a domain event
     * 
     * 1. Stores event in EventStore (immutable log)
     * 2. Executes all registered handlers
     * 3. Errors in handlers don't affect event storage
     */
    async emit(event: DomainEvent): Promise<void> {
        // 1. Store event (source of truth)
        const storedEvent = await EventStoreService.store(event)

        // 2. Get handlers for this event type
        const handlers = this.handlers.get(event.eventType) || []

        // 3. Execute handlers in sequence
        for (const handler of handlers) {
            try {
                await handler({
                    ...event,
                    id: storedEvent.id,
                    timestamp: storedEvent.timestamp
                })
            } catch (error) {
                // Log error but don't fail event emission
                console.error(
                    `Event handler error for ${event.eventType}:`,
                    error
                )

                // In production, send to error tracking service
                // e.g., Sentry.captureException(error)
            }
        }
    }

    /**
     * Emit multiple events
     * 
     * Events are stored atomically but handlers run independently
     */
    async emitMany(events: DomainEvent[]): Promise<void> {
        const storedEvents = await EventStoreService.storeMany(events)

        // Execute handlers for each event
        for (let i = 0; i < events.length; i++) {
            const event = events[i]
            const storedEvent = storedEvents[i]
            const handlers = this.handlers.get(event.eventType) || []

            for (const handler of handlers) {
                try {
                    await handler({
                        ...event,
                        id: storedEvent.id,
                        timestamp: storedEvent.timestamp
                    })
                } catch (error) {
                    console.error(
                        `Event handler error for ${event.eventType}:`,
                        error
                    )
                }
            }
        }
    }

    /**
     * Clear all handlers (mainly for testing)
     */
    clearHandlers() {
        this.handlers.clear()
    }
}

// Export singleton instance
export const EventBus = new EventBusClass()
