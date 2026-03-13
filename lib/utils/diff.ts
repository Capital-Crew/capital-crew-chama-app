
export type DiffResult = Record<
    string,
    { before: unknown; after: unknown }
>;

/**
 * Returns only the keys that changed between two objects.
 * Comparison is done by JSON serialization so nested objects
 * and arrays are compared by value, not reference.
 *
 * Example output for a loan approval:
 * {
 *   status:     { before: "PENDING",  after: "APPROVED" },
 *   approvedAt: { before: null,       after: "2026-03-11T19:00:00Z" },
 * }
 */
export function deepDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>
): DiffResult {
    const changes: DiffResult = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
        const b = before[key];
        const a = after[key];
        if (JSON.stringify(b) !== JSON.stringify(a)) {
            changes[key] = { before: b, after: a };
        }
    }

    return changes;
}
