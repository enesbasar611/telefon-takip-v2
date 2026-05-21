import { readFileSync } from "fs";
import { join } from "path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(
  join(process.cwd(), "src/components/courier/courier-dashboard-client.tsx"),
  "utf8"
);

assert(
  source.includes("getCourierItemDisplayName"),
  "Courier item rows should use a shared display-name helper."
);
assert(
  source.includes("product?.name"),
  "Courier item names should fall back to the related product name."
);
assert(
  source.includes("{getCourierItemDisplayName(item)}"),
  "Courier item card title should render the item display name."
);

console.log("courier-item-name-render tests passed");
