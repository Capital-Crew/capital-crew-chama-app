import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Centrally handles API errors to prevent internal leakage.
 * Logs full details to server, returns generic message to client.
 */
export function handleApiError(error: any, context: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log detailed error server-side
    logger.error(`[API_ERROR] ${context}`, {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
    });

    const statusCode = error.status || 500;

    // Determine user-facing message
    let userMessage = 'An unexpected error occurred. Please try again later.';

    if (!isProduction) {
        // In dev, provide more context
        userMessage = error.message || userMessage;
    } else if (statusCode < 500) {
        // For 4xx errors, use the provided message as it's likely a validation issue
        userMessage = error.message;
    }

    return NextResponse.json(
        {
            error: userMessage,
            ...(error.digest && { reference: error.digest })
        },
        { status: statusCode }
    );
}
