/**
 * Centralized safe fetch wrapper for the frontend.
 * Ensures consistent error handling and support for requestId tracking.
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    });

    const body = await res.json();

    if (!res.ok) {
        // Construct a safe error object for the UI
        throw {
            message: body.message || 'An unexpected error occurred. Please try again.',
            errorCode: body.errorCode || 'SYS-0000',
            requestId: body.requestId,
            errors: body.errors, // For VAL- field errors
            status: res.status
        };
    }

    return body;
}
