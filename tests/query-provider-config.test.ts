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
  /staleTime:\s*(?:5\s*\*\s*60\s*\*\s*1000|1000\s*\*\s*60\s*\*\s*5)/.test(source),
  "QueryProvider default staleTime should be 5 minutes."
);

assert(
  source.includes("ReactQueryDevtools"),
  "QueryProvider should mount ReactQueryDevtools in development."
);

console.log("query-provider-config tests passed");
