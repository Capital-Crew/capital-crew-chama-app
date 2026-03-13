import { deepDiff, DiffResult } from './utils/diff';

// Keys that must NEVER appear in audit logs
const REDACTED_KEYS = [
    'password', 'pin', 'mpesapin', 'secret', 'token',
    'accesstoken', 'refreshtoken', 'otp', 'cvv', 'privatekey',
];

interface AuditStep {
    ts: number;           // Date.now() at the moment the step was recorded
    label: string;        // human-readable e.g. "Validated loan limit"
    durationMs?: number;  // only present on endStep()
    metadata?: Record<string, unknown>;
    type: 'INFO' | 'ERROR'; // Added for compatibility
}

interface AuditContextPayload {
    steps: AuditStep[];
    stateBefore?: Record<string, unknown>;
    stateAfter?: Record<string, unknown>;
    diff?: DiffResult;
    entityType?: string;
    entityId?: string;
    errorCode?: string;
    hadPartialSuccess: boolean; // true if endStep was called before failStep
}

export class AuditContextStore {
    private steps: AuditStep[] = [];
    private stateBefore?: Record<string, unknown>;
    private stateAfter?: Record<string, unknown>;
    private entityType?: string;
    private entityId?: string;
    private errorCode?: string;
    private stepStart?: number;
    private completedStepCount = 0;
    private context?: string; // Cache backward compatibility

    // ── Entity state capture ─────────────────────────────────────────

    /**
     * Call this BEFORE the main database write.
     * Stores a sanitized snapshot of the entity's current state.
     */
    captureBefore(entityType: string, entityId: string, state: object): void {
        this.entityType = entityType;
        this.entityId = entityId;
        this.stateBefore = this.sanitize(state);
    }

    /**
     * Call this AFTER the main database write succeeds.
     * Stores a sanitized snapshot of the entity's updated state.
     * The diff is computed automatically in build().
     */
    captureAfter(state: object): void {
        this.stateAfter = this.sanitize(state);
    }

    // ── Step tracking ─────────────────────────────────────────────────

    /**
     * Mark the start of a logical step. Starts an internal timer.
     * Pair with endStep() on success or failStep() on failure.
     */
    beginStep(label: string, metadata?: Record<string, unknown>): void {
        this.stepStart = Date.now();
        this.steps.push({ ts: Date.now(), label: `→ ${label}`, metadata, type: 'INFO' });
    }

    /**
     * Mark a step as completed. Records duration since beginStep().
     */
    endStep(label: string, metadata?: Record<string, unknown>): void {
        const durationMs = this.stepStart ? Date.now() - this.stepStart : undefined;
        this.stepStart = undefined;
        this.completedStepCount++;
        this.steps.push({ ts: Date.now(), label: `✓ ${label}`, durationMs, metadata, type: 'INFO' });
    }

    /**
     * Mark a step as failed. Records the error. Does NOT throw.
     * Throw the error yourself after calling this.
     */
    failStep(label: string, error: unknown, metadata?: Record<string, unknown>): void {
        this.steps.push({
            ts: Date.now(),
            label: `✗ ${label}`,
            type: 'ERROR',
            metadata: {
                ...metadata,
                error: error instanceof Error ? error.message : String(error),
            },
        });
    }

    /**
     * Backwards-compatible alias for existing call sites that use
     * a single addStep() / log() method. Treat as a simple info step.
     */
    addStep(label: string, metadata?: Record<string, unknown>): void {
        this.steps.push({ ts: Date.now(), label, metadata, type: 'INFO' });
        this.completedStepCount++;
    }

    // Compatibility aliases
    log(label: string, details?: any) {
        this.addStep(label, details);
    }

    track(label: string, metadata?: any) {
        this.addStep(label, metadata);
    }

    error(label: string, error: any) {
        this.failStep(label, error);
    }

    setContext(context: string) {
        this.context = context;
    }

    getContext() {
        return this.context;
    }

    // ── Error classification ──────────────────────────────────────────

    /**
     * Set a structured error code for the failure.
     * Use SCREAMING_SNAKE_CASE e.g. "LOAN_LIMIT_EXCEEDED"
     */
    setErrorCode(code: string): void {
        this.errorCode = code;
    }

    // ── Build final payload for withAudit ────────────────────────────

    build(): AuditContextPayload {
        const diff =
            this.stateBefore && this.stateAfter
                ? deepDiff(this.stateBefore, this.stateAfter)
                : undefined;

        return {
            steps: this.steps,
            stateBefore: this.stateBefore,
            stateAfter: this.stateAfter,
            diff,
            entityType: this.entityType,
            entityId: this.entityId,
            errorCode: this.errorCode,
            hadPartialSuccess: this.completedStepCount > 0,
        };
    }

    getSummary() {
        return this.steps;
    }

    flush() {
        this.steps = [];
        this.stateBefore = undefined;
        this.stateAfter = undefined;
        this.completedStepCount = 0;
        this.errorCode = undefined;
    }

    // ── Sanitization ──────────────────────────────────────────────────

    private sanitize(obj: object): Record<string, unknown> {
        try {
            return JSON.parse(
                JSON.stringify(obj),
                (key, value) =>
                    typeof key === 'string' && REDACTED_KEYS.includes(key.toLowerCase()) ? '[REDACTED]' : value
            );
        } catch {
            return { error: 'Failed to sanitize' };
        }
    }
}

import { cache } from 'react';
export const getAuditContext = cache(() => new AuditContextStore());

export const AuditContext = {
    setContext: (context: string) => getAuditContext().setContext(context),
    log: (action: string, details?: any) => getAuditContext().log(action, details),
    error: (action: string, error: any) => getAuditContext().error(action, error),
    track: (action: string, metadata?: any) => getAuditContext().track(action, metadata),
    addStep: (action: string, metadata?: any) => getAuditContext().addStep(action, metadata),
    beginStep: (label: string, metadata?: any) => getAuditContext().beginStep(label, metadata),
    endStep: (label: string, metadata?: any) => getAuditContext().endStep(label, metadata),
    failStep: (label: string, error: any, metadata?: any) => getAuditContext().failStep(label, error, metadata),
    captureBefore: (type: string, id: string, state: any) => getAuditContext().captureBefore(type, id, state),
    captureAfter: (state: any) => getAuditContext().captureAfter(state),
    setErrorCode: (code: string) => getAuditContext().setErrorCode(code),
    getSummary: () => getAuditContext().getSummary(),
    getContext: () => getAuditContext().getContext(),
    flush: () => getAuditContext().flush(),
    build: () => getAuditContext().build(),
};
