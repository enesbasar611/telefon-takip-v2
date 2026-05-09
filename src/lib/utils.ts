import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string to Sentence Case with Turkish support.
 */
export function toSentenceCase(str: string): string {
  if (!str) return str;
  const trimmed = str.trim();
  if (trimmed.length === 0) return str;
  const lower = trimmed.toLocaleLowerCase('tr-TR');
  return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
}

/**
 * Converts a string to Title Case with Turkish support.
 * Example: "a36 ekran değişimi" -> "A36 Ekran Değişimi"
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .trim()
    .split(/\s+/)
    .map(word => {
      if (!word) return "";
      const lower = word.toLocaleLowerCase('tr-TR');
      return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
    })
    .join(" ");
}

/**
 * Formats a name string: First Name(s) in Title Case, Last Name in UPPER CASE.
 * Example: "enes başar" -> "Enes BAŞAR"
 */
export function formatName(str: string): string {
  if (!str) return str;
  const parts = str.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toLocaleUpperCase('tr-TR');

  const lastName = parts.pop()?.toLocaleUpperCase('tr-TR') || "";
  const firstNames = parts.map(name => {
    const lower = name.toLocaleLowerCase('tr-TR');
    return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
  }).join(" ");

  return `${firstNames} ${lastName}`;
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
    // Deep check for Decimal.js-like structure
    if ('d' in data && 'e' in data && 's' in data && Array.isArray((data as any).d)) {
      // Use valueOf if available, otherwise reconstruct
      if (typeof (data as any).valueOf === "function") {
        const val = (data as any).valueOf();
        return typeof val === "number" ? val : Number(val);
      }
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
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("90")) cleaned = cleaned.substring(2);
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  cleaned = cleaned.substring(0, 10);

  if (cleaned.length < 10) return phone;
  const part1 = cleaned.substring(0, 3);
  const part2 = cleaned.substring(3, 6);
  const part3 = cleaned.substring(6, 10);
  return `+90 (${part1}) ${part2} ${part3}`;
}
/**
 * Formats a number or string to Turkish currency format (1.234,56)
 * @param amount Number or string to format
 * @param showSymbol Whether to include ₺ symbol
 */
export function formatCurrency(amount: number | string | null | undefined, showSymbol: boolean = false): string {
  if (amount === null || amount === undefined || amount === "") return showSymbol ? "₺0" : "0,00";
  const num = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount;
  if (isNaN(num)) return showSymbol ? "₺0" : "0,00";

  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return showSymbol ? `₺${formatted}` : formatted;
}

/**
 * Parses a Turkish formatted number string (e.g. "1.234,56") back to a standard number
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove group separator (dot) and replace decimal separator (comma) with dot
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Gets initials from a name (max 2 characters).
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toLocaleUpperCase('tr-TR');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr-TR');
}

/**
 * Returns a deterministic tailwind background color based on a string.
 */
export function getDeterministicColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500",
    "bg-violet-500", "bg-cyan-500", "bg-orange-500", "bg-fuchsia-500",
    "bg-indigo-500", "bg-teal-500"
  ];
  if (!name) return colors[0];
  const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
}
