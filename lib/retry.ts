import { AppError, ErrorCodes } from './errors';

/**
 * Utility to sleep for a given duration.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks if an error code is retryable.
 * Retryable: GW- (Gateway), SYS- (Infrastructure / Connection).
 * Not Retryable: VAL- (Validation), AUTH- (Auth), AUTHZ- (Authz), BIZ- (Business logic).
 */
function isRetryableCode(errorCode: string): boolean {
    return errorCode.startsWith('GW-') || errorCode.startsWith('SYS-');
}

/**
 * Executes an async function with exponential backoff retry logic.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    { maxAttempts = 3, baseDelayMs = 300 } = {}
): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const isLast = attempt === maxAttempts;
            const isRetryable = err instanceof AppError && isRetryableCode(err.errorCode);

            // If it's the last attempt or the error is not retryable, throw it
            if (isLast || !isRetryable) {
                throw err;
            }

            // Exponential backoff with jitter
            const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 100;
            
            // Log retry attempt (could use the logger here too)
            console.warn(`[RETRY] Attempt ${attempt} failed with ${err.errorCode}. Retrying in ${Math.round(delay)}ms...`);
            
            await sleep(delay);
        }
    }
    
    // This part should technically be unreachable due to the throw in the loop, 
    // but kept for completeness.
    throw new AppError('Max retries exceeded', 503, ErrorCodes.GATEWAY_TIMEOUT, false);
}
