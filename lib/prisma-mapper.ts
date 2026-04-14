import { Prisma } from '@prisma/client';
import { AppError, ErrorCodes } from './errors';

/**
 * Maps Prisma-specific errors to sanitized AppError instances.
 * Prevents DB schema leakage and sensitive detail exposure.
 */
export function mapPrismaError(err: unknown): AppError {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': {
                // Unique constraint violation
                const target = (err.meta?.target as string[])?.join(', ') || 'field';
                return new AppError(
                    `A record with this ${target} already exists`,
                    409,
                    ErrorCodes.DUPLICATE_RECORD
                );
            }
            case 'P2025':
                return new AppError(
                    'The requested record was not found',
                    404,
                    ErrorCodes.RECORD_NOT_FOUND
                );
            case 'P2003':
                return new AppError(
                    'Operation failed due to a related record dependency',
                    400,
                    ErrorCodes.INVALID_INPUT
                );
            case 'P2034':
                // Transaction failed due to a write conflict or deadlock
                return new AppError(
                    'Transaction failed due to concurrent modification. Please try again.',
                    409,
                    ErrorCodes.CONCURRENCY_ERROR
                );
            default:
                // General known request error
                return new AppError(
                    'Database operation failed',
                    500,
                    ErrorCodes.DATABASE_ERROR,
                    false // Not operational - potentially a programmer error or unexpected state
                );
        }
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
        return new AppError(
            'Database connection could not be established',
            503,
            ErrorCodes.DATABASE_ERROR,
            false
        );
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        return new AppError(
            'Invalid data provided to the database',
            400,
            ErrorCodes.INVALID_INPUT,
            true
        );
    }

    // Default catch-all for unknown errors
    return new AppError(
        'An unexpected internal error occurred',
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        false
    );
}
