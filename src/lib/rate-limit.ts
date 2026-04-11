// Simple memory-based rate limiter for Next.js Server Actions
// In production with multiple instances, use Upstash Redis or similar.

type RateLimitRecord = {
    count: number;
    resetTime: number;
};

const cache = new Map<string, RateLimitRecord>();

/**
 * Basic rate limiter
 * @param identifier - Unique identifier for the client (e.g., IP or user ID)
 * @param limit - Max requests in the window
 * @param windowMs - Window duration in milliseconds
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(identifier: string, limit: number = 20, windowMs: number = 60000) {
    const now = Date.now();
    const record = cache.get(identifier);

    if (!record) {
        const newRecord = { count: 1, resetTime: now + windowMs };
        cache.set(identifier, newRecord);
        return { success: true, remaining: limit - 1, reset: newRecord.resetTime };
    }

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return { success: true, remaining: limit - 1, reset: record.resetTime };
    }

    if (record.count >= limit) {
        return { success: false, remaining: 0, reset: record.resetTime };
    }

    record.count++;
    return { success: true, remaining: limit - record.count, reset: record.resetTime };
}

/**
 * Utility for Server Actions to quickly check rate limits
 * Throws an error if limit exceeded.
 */
export async function checkRateLimit(identifier: string, limit: number = 20, windowMs: number = 60000) {
    const result = rateLimit(identifier, limit, windowMs);
    if (!result.success) {
        throw new Error("Çok fazla istek gönderildi. Lütfen biraz bekleyin.");
    }
    return result;
}

// Cleanup interval to prevent memory leaks (runs once per hour)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of Array.from(cache.entries())) {
            if (now > record.resetTime + 3600000) { // Keep records for 1 hour after reset
                cache.delete(key);
            }
        }
    }, 3600000);
}
