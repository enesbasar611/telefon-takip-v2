import { SERVICE_STATUS_GROUPS, STATUS_CONFIG } from "../src/lib/constants/service";
import { ServiceStatus } from "@prisma/client";

function assert(condition: unknown, message: string) {
    if (!condition) {
        console.error("❌ FAILED:", message);
        process.exit(1);
    }
}

console.log("🧪 Running Service Status Logic Tests...");

// 1. Check if all required statuses are in groups
const allGroupedStatuses = [
    ...SERVICE_STATUS_GROUPS.ACTIVE,
    ...SERVICE_STATUS_GROUPS.READY,
    ...SERVICE_STATUS_GROUPS.DONE
];

const requiredStatuses: ServiceStatus[] = [
    "PENDING",
    "APPROVED",
    "REPAIRING",
    "WAITING_PART",
    "READY",
    "DELIVERED",
    "CANCELLED"
];

requiredStatuses.forEach(status => {
    assert(
        allGroupedStatuses.includes(status),
        `Status ${status} is missing from SERVICE_STATUS_GROUPS`
    );
});

// 2. Check overlap (a status should belong to only one group)
const findDuplicates = (arr: string[]) => arr.filter((item, index) => arr.indexOf(item) !== index);
const duplicates = findDuplicates(allGroupedStatuses);
assert(duplicates.length === 0, `Duplicate statuses found in groups: ${duplicates.join(", ")}`);

// 3. Check STATUS_CONFIG coverage
requiredStatuses.forEach(status => {
    assert(
        STATUS_CONFIG[status] !== undefined,
        `Status ${status} is missing from STATUS_CONFIG`
    );
    assert(
        typeof STATUS_CONFIG[status].label === "string" && STATUS_CONFIG[status].label.length > 0,
        `Status ${status} label is missing or empty`
    );
    assert(
        typeof STATUS_CONFIG[status].color === "string" && STATUS_CONFIG[status].color.length > 0,
        `Status ${status} color is missing or empty`
    );
});

// 4. Check Logical Categories
assert(SERVICE_STATUS_GROUPS.ACTIVE.includes("PENDING"), "PENDING should be ACTIVE");
assert(SERVICE_STATUS_GROUPS.ACTIVE.includes("REPAIRING"), "REPAIRING should be ACTIVE");
assert(SERVICE_STATUS_GROUPS.READY.includes("READY"), "READY should be in READY group");
assert(SERVICE_STATUS_GROUPS.DONE.includes("DELIVERED"), "DELIVERED should be DONE");
assert(SERVICE_STATUS_GROUPS.DONE.includes("CANCELLED"), "CANCELLED should be DONE");

console.log("✅ All Service Status Logic Tests Passed!");
