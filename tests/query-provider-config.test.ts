import { readFileSync } from "fs";
import { join } from "path";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const providerPath = join(process.cwd(), "src", "components", "providers", "QueryProvider.tsx");
const source = readFileSync(providerPath, "utf8");

assert(
  source.includes("staleTime: 1000 * 60 * 5"),
  "QueryProvider default staleTime should be 5 minutes."
);

assert(
  source.includes("ReactQueryDevtools"),
  "QueryProvider should mount ReactQueryDevtools in development."
);

console.log("query-provider-config tests passed");
