import { Decimal } from "@prisma/client/runtime/library";

export type Serialized<T> = T extends Decimal
    ? number
    : T extends Date
    ? string
    : T extends Array<infer U>
    ? Array<Serialized<U>>
    : T extends object
    ? { [K in keyof T]: Serialized<T[K]> }
    : T;

export function serializeFinancials<T>(data: T): Serialized<T> {
    if (data === null || data === undefined) return data as any;
    if (typeof data === "number" || typeof data === "string" || typeof data === "boolean") return data as any;
    if (data instanceof Date) return data.toISOString() as any;
    if (data instanceof Decimal || (typeof data === "object" && "d" in data && "e" in data && "s" in data)) {
        return Number(data) as any;
    }
    if (Array.isArray(data)) return data.map((item) => serializeFinancials(item)) as any;
    if (typeof data === "object") {
        const newObj: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = serializeFinancials((data as any)[key]);
            }
        }
        return newObj as any;
    }
    return data as any;
}
