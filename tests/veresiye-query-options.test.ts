import { VERESIYE_LIVE_QUERY_OPTIONS } from "../src/lib/finance/veresiye-query-options";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(VERESIYE_LIVE_QUERY_OPTIONS.staleTime === 0, "Veresiye data should become stale immediately.");
assert(VERESIYE_LIVE_QUERY_OPTIONS.refetchOnMount === "always", "Veresiye data should refetch when returning to the page.");
assert(VERESIYE_LIVE_QUERY_OPTIONS.refetchOnWindowFocus === true, "Veresiye data should refetch after focusing the tab.");
assert(VERESIYE_LIVE_QUERY_OPTIONS.refetchOnReconnect === true, "Veresiye data should refetch after reconnect.");

console.log("veresiye-query-options tests passed");
