/**
 * Event Store Service - Immutable Event Storage
 * 
 * Provides the foundation for Event Sourcing by storing all
 * domain events in an append-only log.
 * 
 * Key Principles:
 * - Events are immutable (never updated/deleted)
 * - Events are append-only
 * - Events are the source of truth
 * - State is derived from events
 */

import { db } from '@/lib/db'
import type { AggregateType, DomainEventType } from '@prisma/client'

// ========================================
// TYPES
// ========================================

export interface DomainEvent {
    aggregateType: AggregateType
    aggregateId: string
    eventType: DomainEventType
    eventVersion?: number
    actorId: string
    actorName: string
    metadata: Record<string, any>
    causationId?: string      // Event that caused this
    correlationId?: string    // Original request ID
}

export interface EventQuery {
    aggregateType?: AggregateType
    aggregateId?: string
    eventType?: DomainEventType
    from?: Date
    to?: Date
    limit?: number
}

// ========================================
// SERVICE
// ========================================

export class EventStoreService {
    /**
     * Store a domain event
     * 
     * Events are immutable and append-only.
     * Returns the stored event with generated ID and timestamp.
     */
    static async store(event: DomainEvent) {
        const storedEvent = await db.domainEvent.create({
            data: {
                aggregateType: event.aggregateType,
                aggregateId: event.aggregateId,
                eventType: event.eventType,
                eventVersion: event.eventVersion || 1,
                actorId: event.actorId,
                actorName: event.actorName,
                metadata: event.metadata,
                causationId: event.causationId,
                correlationId: event.correlationId
            }
        })

        return storedEvent
    }

    /**
     * Store multiple events atomically
     */
    static async storeMany(events: DomainEvent[]) {
        return await db.$transaction(
            events.map(event =>
                db.domainEvent.create({
                    data: {
                        aggregateType: event.aggregateType,
                        aggregateId: event.aggregateId,
                        eventType: event.eventType,
                        eventVersion: event.eventVersion || 1,
                        actorId: event.actorId,
                        actorName: event.actorName,
                        metadata: event.metadata,
                        causationId: event.causationId,
                        correlationId: event.correlationId
                    }
                })
            )
        )
    }

    /**
     * Get events for an aggregate
     * 
     * Returns all events for a specific aggregate (e.g., a loan)
     * ordered by timestamp.
     */
    static async getAggregateEvents(
        aggregateType: AggregateType,
        aggregateId: string
    ) {
        return await db.domainEvent.findMany({
            where: {
                aggregateType,
                aggregateId
            },
            orderBy: { timestamp: 'asc' }
        })
    }

    /**
     * Query events with filters
     */
    static async queryEvents(query: EventQuery) {
        const where: any = {}

        if (query.aggregateType) {
            where.aggregateType = query.aggregateType
        }

        if (query.aggregateId) {
            where.aggregateId = query.aggregateId
        }

        if (query.eventType) {
            where.eventType = query.eventType
        }

        if (query.from || query.to) {
            where.timestamp = {}
            if (query.from) {
                where.timestamp.gte = query.from
            }
            if (query.to) {
                where.timestamp.lte = query.to
            }
        }

        return await db.domainEvent.findMany({
            where,
            orderBy: { timestamp: 'asc' },
            take: query.limit
        })
    }

    /**
     * Get events by type
     */
    static async getEventsByType(
        eventType: DomainEventType,
        options?: { from?: Date; to?: Date; limit?: number }
    ) {
        return await this.queryEvents({
            eventType,
            ...options
        })
    }

    /**
     * Get events by correlation ID
     * 
     * Useful for tracing all events caused by a single user request
     */
    static async getEventsByCorrelation(correlationId: string) {
        return await db.domainEvent.findMany({
            where: { correlationId },
            orderBy: { timestamp: 'asc' }
        })
    }

    /**
     * Get event stream (all events in order)
     * 
     * WARNING: This can be huge! Use with caution or pagination.
     */
    static async getEventStream(options?: {
        from?: Date
        to?: Date
        limit?: number
    }) {
        return await this.queryEvents(options || {})
    }

    /**
     * Count events
     */
    static async countEvents(query: Omit<EventQuery, 'limit'>) {
        const where: any = {}

        if (query.aggregateType) {
            where.aggregateType = query.aggregateType
        }

        if (query.eventType) {
            where.eventType = query.eventType
        }

        return await db.domainEvent.count({ where })
    }
}
