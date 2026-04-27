import assert from "node:assert/strict";
import { buildScannerUrl } from "../src/lib/scanner-url";

assert.equal(
  buildScannerUrl({
    roomId: "scanner-abc",
    browserOrigin: "http://localhost:5000",
    networkInfo: { ip: "192.168.1.25", port: 5000, origin: "http://localhost:5000" },
  }),
  "http://192.168.1.25:5000/scanner?room=scanner-abc"
);

assert.equal(
  buildScannerUrl({
    roomId: "scanner-abc",
    browserOrigin: "https://basarteknik.tech",
    networkInfo: { ip: "192.168.1.25", port: 5000, origin: "https://basarteknik.tech" },
  }),
  "https://basarteknik.tech/scanner?room=scanner-abc"
);

assert.equal(
  buildScannerUrl({
    roomId: "room with space",
    browserOrigin: "http://127.0.0.1:5000",
    networkInfo: { allIps: ["10.0.0.12"], port: "5000" },
  }),
  "http://10.0.0.12:5000/scanner?room=room+with+space"
);

console.log("scanner-url tests passed");
