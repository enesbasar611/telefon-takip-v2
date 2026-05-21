import { readFileSync } from "fs";
import { join } from "path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(join(process.cwd(), "src/lib/edm/service.ts"), "utf8");

assert(!source.includes("soapenv:Envelope"), "EDM service should not contain SOAP envelope code.");
assert(!source.includes("SOAPAction"), "EDM service should not send SOAPAction headers.");
assert(source.includes("LoginRequest"), "EDM login should call the REST LoginRequest endpoint.");
assert(source.includes('"Content-Type": "application/json"'), "EDM login should send JSON.");
assert(source.includes("useR_NAME"), "EDM login should send the Swagger username field.");
assert(source.includes("sessioN_ID"), "EDM login should read the Swagger session token field.");
assert(source.includes("hostname"), "EDM login header should include hostname because EDM rejects login without it.");
assert(source.includes("reason"), "EDM login header should include reason because EDM rejects login without it.");
assert(source.includes("isSoapServiceUrl"), "EDM service should ignore legacy SOAP .svc URLs for REST login.");
assert(source.includes("EDM_REST_API_URL"), "EDM service should support a dedicated REST base URL env var.");
assert(source.includes("sendInvoice"), "EDM service should expose sendInvoice.");
assert(source.includes("/api/SetArchiveInvoiceRequest"), "EDM invoice send should target the e-Archive REST endpoint.");
assert(source.includes("Authorization"), "EDM invoice send should include the session token in Authorization header.");
assert(source.includes("buildInvoiceXml"), "EDM invoice send should build UBL XML from dynamic invoice data.");
assert(source.includes("extractInvoiceUuid"), "EDM invoice send should extract EDM invoice UUID from response.");
assert(source.includes("extractEdmError"), "EDM invoice errors should expose sanitized response details.");
assert(source.includes("getEdmCurrencyCode"), "EDM invoice header should use Swagger's numeric currency enum.");

console.log("edm-rest-client tests passed");
