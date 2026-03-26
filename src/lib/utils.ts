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

  // Handle Prisma Decimal
  // More robust check for Decimal objects which might have minified constructor names
  if (
    typeof data === "object" &&
    (
      (data as any).constructor?.name === "Decimal" ||
      ((data as any).toNumber && (data as any).toFixed && !((data as any) instanceof Function))
    )
  ) {
    return Number((data as any).toNumber());
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map(serializePrisma);
  }

  // Handle Objects recursively
  if (typeof data === "object" && data.constructor?.name === "Object") {
    const obj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        obj[key] = serializePrisma((data as any)[key]);
      }
    }
    return obj;
  }

  // Fallback for objects that might be class instances but not Decimals or Dates
  // We want to avoid passing functions to Client Components
  if (typeof data === "object") {
    const obj: any = {};
    for (const key in data) {
      if (
        Object.prototype.hasOwnProperty.call(data, key) &&
        typeof (data as any)[key] !== "function"
      ) {
        obj[key] = serializePrisma((data as any)[key]);
      }
    }
    return obj;
  }

  return data;
}
