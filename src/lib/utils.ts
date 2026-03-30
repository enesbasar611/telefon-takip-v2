import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string to Sentence Case.
 * Example: "IPHONE 11" -> "Iphone 11"
 */
export function toSentenceCase(str: string): string {
  if (!str) return str;
  const trimmed = str.trim();
  if (trimmed.length === 0) return str;
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Serializes Prisma objects for Next.js Server Components to Client Components.
 * Handles Dates, Decimals, and recursive objects/arrays.
 */
export function serializePrisma<T>(data: T): any {
  if (data === null || data === undefined) return data;

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle Prisma Decimal / Decimal.js
  if (typeof data === "object" && data !== null) {
    if (typeof (data as any).toNumber === "function") {
      return Number((data as any).toNumber());
    }
    // Also catch raw parsed decimal shapes just in case
    if ('d' in data && 'e' in data && 's' in data && Array.isArray((data as any).d)) {
      return Number(((data as any).d || []).join(''));
    }
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item));
  }

  // Handle Objects recursively
  if (typeof data === "object" && data !== null) {
    const obj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        obj[key] = serializePrisma((data as any)[key]);
      }
    }
    return obj;
  }

  return data;
}

/**
 * Formats a 10-digit phone number to +90 (5XX) XXX XX XX
 * Example: 5431234567 -> +90 (543) 123 45 67
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "").substring(0, 10);
  if (cleaned.length < 10) return phone;
  const part1 = cleaned.substring(0, 3);
  const part2 = cleaned.substring(3, 6);
  const part3 = cleaned.substring(6, 10);
  return `+90 ${part1} ${part2} ${part3}`;
}
