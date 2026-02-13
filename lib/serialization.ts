/**
 * Serialization Utility for Prisma Objects
 * 
 * Next.js Server Components cannot pass complex objects (like Prisma's Decimal) 
 * directly to Client Components. This utility recursively traverses an object
 * and converts specific types to serialization-safe primitives.
 * 
 * - Decimal -> number
 * - Date -> Date (Next.js supports Date, so we keep it)
 * - Array -> Array (Recursive)
 * - Object -> Object (Recursive)
 */

export function serializePrisma<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data === 'object') {
        // Handle Arrays
        if (Array.isArray(data)) {
            return data.map(item => serializePrisma(item)) as unknown as T;
        }

        // Handle Date (Convert to String for Client Components)
        if (data instanceof Date) {
            return data.toISOString() as unknown as T;
        }

        // Handle Prisma Decimal (Duck Typing)
        // Prisma Decimals have a .toNumber() method
        if (typeof (data as any).toNumber === 'function') {
            return (data as any).toNumber();
        }

        // Handle Plain Objects
        const serialized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                serialized[key] = serializePrisma((data as any)[key]);
            }
        }
        return serialized;
    }

    return data;
}
