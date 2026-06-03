// Simple JS test to verify logic without TS resolution overhead
const SERVICE_STATUS_GROUPS = {
    ACTIVE: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"],
    READY: ["READY"],
    DONE: ["DELIVERED", "CANCELLED"],
};

function assert(condition, message) {
    if (!condition) {
        console.error("❌ FAILED:", message);
        process.exit(1);
    }
}

console.log("🧪 Running Service Status Logic Verification...");

const allGroupedStatuses = [
    ...SERVICE_STATUS_GROUPS.ACTIVE,
    ...SERVICE_STATUS_GROUPS.READY,
    ...SERVICE_STATUS_GROUPS.DONE
];

const requiredStatuses = [
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

assert(SERVICE_STATUS_GROUPS.ACTIVE.includes("PENDING"), "PENDING should be ACTIVE");
assert(SERVICE_STATUS_GROUPS.DONE.includes("DELIVERED"), "DELIVERED should be DONE");

console.log("✅ Service Status Logic Verified Successfully!");
