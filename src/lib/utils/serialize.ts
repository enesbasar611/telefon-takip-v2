import { Decimal } from "@prisma/client/runtime/library";

/**
 * Recursively converts Decimal objects to numbers in a given object or array.
 * This is necessary for passing data from Server Components/Actions to Client Components
 * in Next.js, as Decimal objects are not serializable by default.
 */
export function serializeDecimal<T>(data: T): any {
    if (data === null || data === undefined) return data;

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => serializeDecimal(item));
    }

    // Handle Objects
    if (typeof data === "object") {
        // Check if it's a Decimal instance
        // Note: Checking for .toFixed or .toNumber or specific Prisma behavior is safer than instanceof sometimes
        if ((data as any).toNumber && typeof (data as any).toNumber === "function") {
            return (data as any).toNumber();
        }

        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = serializeDecimal(data[key]);
            }
        }
        return result;
    }

    return data;
}
