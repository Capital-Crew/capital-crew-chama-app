import { db as prisma } from './db';
import { Prisma } from '@prisma/client';

/**
 * Error thrown when an idempotent request is already in progress
 */
export class RequestInProgressError extends Error {
    constructor(key: string) {
        super(`Request with key ${key} is already in progress`);
        this.name = 'RequestInProgressError';
    }
}

/**
 * Options for the withIdempotency wrapper
 */
interface IdempotencyOptions<T> {
    key: string;
    path: string;
    businessLogic: () => Promise<T>;
}

/**
 * Higher-order function that wraps business logic with idempotency protection
 * 
 * @param options - Configuration object
 * @param options.key - UUID from frontend (idempotency key)
 * @param options.path - Action name for tracking (e.g., "createLoan", "submitExpense")
 * @param options.businessLogic - The actual business logic function to execute
 * 
 * @returns The result of the business logic (either fresh or cached)
 * 
 * @throws {RequestInProgressError} If the request is currently being processed
 * 
 * @example
 * ```typescript
 * const result = await withIdempotency({
 *   key: idempotencyKey,
 *   path: 'createLoan',
 *   businessLogic: async () => {
 *     return await createLoanInDatabase(data);
 *   }
 * });
 * ```
 */
export async function withIdempotency<T>({
    key,
    path,
    businessLogic
}: IdempotencyOptions<T>): Promise<T> {
    try {
        // Step 1: Try to create a new idempotency record
        await prisma.idempotencyRecord.create({
            data: {
                key,
                path,
                locked: true,
                response: Prisma.JsonNull
            }
        });

        // Step 2: Record created successfully - this is a new request
        // Execute the business logic
        try {
            const result = await businessLogic();

            // Step 3: Store the result and unlock
            await prisma.idempotencyRecord.update({
                where: { key },
                data: {
                    response: result as any, // Cast to any to handle complex return types in JSON
                    locked: false
                }
            });

            return result;
        } catch (error) {
            // If business logic fails, delete the record so user can retry
            await prisma.idempotencyRecord.delete({
                where: { key }
            }).catch(() => {
                // Ignore deletion errors
            });
            throw error;
        }
    } catch (error: any) {
        // Step 4: Record already exists - check if it's locked or completed
        if (error.code === 'P2002') { // Unique constraint violation
            const existing = await prisma.idempotencyRecord.findUnique({
                where: { key }
            });

            if (!existing) {
                // Race condition: record was deleted between create and findUnique
                // Retry the operation
                return withIdempotency({ key, path, businessLogic });
            }

            if (existing.locked) {
                // Request is currently in progress
                throw new RequestInProgressError(key);
            }

            // Request completed previously - return cached response
            return existing.response as T;
        }

        // Unknown error - rethrow
        throw error;
    }
}

/**
 * Cleanup old idempotency records (optional utility)
 * Call this periodically (e.g., via cron job) to prevent table bloat
 * 
 * @param olderThanDays - Delete records older than this many days (default: 7)
 */
export async function cleanupIdempotencyRecords(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.idempotencyRecord.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate
            },
            locked: false // Only delete completed requests
        }
    });

    return result.count;
}
