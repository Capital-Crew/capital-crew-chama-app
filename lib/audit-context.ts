import { cache } from 'react';

// Define the shape of a single audit step
export interface AuditStep {
    action: string;
    details?: any; // Flexible data
    timestamp: Date;
    type: 'INFO' | 'ERROR';
}

export interface AuditContextState {
    steps: AuditStep[];
    context?: string;
    startTime: number;
}

// Define the shape of the Audit Context Store
class AuditContextStore {
    private state: AuditContextState;

    constructor() {
        this.state = {
            steps: [],
            startTime: Date.now()
        };
    }

    // Set the high-level context (e.g., "LOAN", "AUTH")
    setContext(context: string) {
        this.state.context = context;
    }

    // Log a normal step
    log(action: string, details?: any) {
        this.state.steps.push({
            action,
            details,
            timestamp: new Date(),
            type: 'INFO'
        });
    }

    // Log an error step
    error(action: string, error: any) {
        this.state.steps.push({
            action,
            details: {
                message: error.message || String(error),
                stack: error.stack,
                ...error // Capture other props if object
            },
            timestamp: new Date(),
            type: 'ERROR'
        });
    }

    // Legacy support for 'track' -> maps to 'log'
    track(action: string, metadata?: any) {
        this.log(action, metadata);
    }

    getSummary(): AuditStep[] {
        return this.state.steps;
    }

    getDuration(): number {
        return Date.now() - this.state.startTime;
    }

    getContext(): string | undefined {
        return this.state.context;
    }

    flush() {
        this.state.steps = [];
        this.state.startTime = Date.now();
    }
}

// Singleton instance scoped to the request using React cache
export const getAuditContext = cache(() => new AuditContextStore());

// Static accessor for ease of use
export const AuditContext = {
    setContext: (context: string) => getAuditContext().setContext(context),
    log: (action: string, details?: any) => getAuditContext().log(action, details),
    error: (action: string, error: any) => getAuditContext().error(action, error),
    track: (action: string, metadata?: any) => getAuditContext().track(action, metadata), // Legacy alias
    getSummary: () => getAuditContext().getSummary(),
    getDuration: () => getAuditContext().getDuration(),
    getContext: () => getAuditContext().getContext(),
    flush: () => getAuditContext().flush(),
};
