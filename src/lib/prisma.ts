import { PrismaClient } from "@prisma/client";

const TRANSIENT_RETRY_DELAYS_MS = [500, 1200, 2500];
const TRANSIENT_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);
const READ_ACTIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function buildResilientDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.protocol.startsWith("postgres")) return rawUrl;

    const currentConnectTimeout = Number(parsed.searchParams.get("connect_timeout") || 0);
    if (!currentConnectTimeout || currentConnectTimeout < 30) {
      parsed.searchParams.set("connect_timeout", "30");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30");
    }
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "10");
    }
    if (parsed.hostname.includes("-pooler.") && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function isTransientConnectionError(err: unknown, action?: string): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  const msg = String((err as { message?: unknown }).message || "");

  // P1001 ("Can't reach database server") fails before query execution, safe to retry for any action.
  if (code === "P1001" || msg.includes("Can't reach database server")) {
    return true;
  }

  // Read queries are idempotent and can safely retry pool/socket resets during Neon cold starts.
  if (action && READ_ACTIONS.has(action)) {
    if (typeof code === "string" && TRANSIENT_ERROR_CODES.has(code)) {
      return true;
    }
    return (
      msg.includes("Server has closed the connection") ||
      msg.includes("Timed out fetching a new connection") ||
      msg.includes("Connection timed out") ||
      msg.includes("ECONNRESET") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("EPIPE")
    );
  }

  return false;
}

const prismaClientSingleton = () => {
  const url = buildResilientDatabaseUrl(process.env.DATABASE_URL);
  const client = new PrismaClient({
    log: process.env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error", "warn"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });

  client.$use(async (params, next) => {
    let attempt = 0;
    while (true) {
      try {
        return await next(params);
      } catch (error) {
        if (
          attempt >= TRANSIENT_RETRY_DELAYS_MS.length ||
          !isTransientConnectionError(error, params.action)
        ) {
          throw error;
        }
        const delayMs = TRANSIENT_RETRY_DELAYS_MS[attempt];
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        await client.$connect().catch(() => undefined);
      }
    }
  });

  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
