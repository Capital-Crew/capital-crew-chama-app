import { cache } from 'react';

// Define the shape of a single audit step
export interface AuditStep {
    action: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}

// Define the shape of the Audit Context
class AuditContextStore {
    private steps: AuditStep[] = [];
    private startTime: number = Date.now();

    track(action: string, metadata?: Record<string, any>) {
        this.steps.push({
            action,
            metadata,
            timestamp: new Date()
        });
    }

    getSummary(): AuditStep[] {
        return this.steps;
    }

    getDuration(): number {
        return Date.now() - this.startTime;
    }

    flush() {
        this.steps = [];
    }
}

// Singleton instance scoped to the request using React cache
// This ensures that multiple calls within the same request share the same context
export const getAuditContext = cache(() => new AuditContextStore());

// Static accessor for ease of use
export const AuditContext = {
    track: (action: string, metadata?: Record<string, any>) => getAuditContext().track(action, metadata),
    getSummary: () => getAuditContext().getSummary(),
    getDuration: () => getAuditContext().getDuration(),
    flush: () => getAuditContext().flush(),
};
