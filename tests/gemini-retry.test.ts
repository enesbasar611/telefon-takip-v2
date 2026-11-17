import assert from "node:assert/strict";
import { isRetryableGeminiError, generateWithRetry, DEFAULT_GEMINI_MODELS } from "../src/lib/gemini";

async function runTests() {
    // 1. Test error classification
    assert.equal(isRetryableGeminiError(new Error("[503 Service Unavailable] This model is currently experiencing high demand")), true);
    assert.equal(isRetryableGeminiError(new Error("429 Too Many Requests")), true);
    assert.equal(isRetryableGeminiError(new Error("Resource has been exhausted")), true);
    assert.equal(isRetryableGeminiError(new Error("The model is overloaded")), true);
    assert.equal(isRetryableGeminiError(new Error("rate limit exceeded")), true);
    assert.equal(isRetryableGeminiError("503 Service Unavailable"), true);
    assert.equal(isRetryableGeminiError(new Error("API_KEY_INVALID")), false);
    assert.equal(isRetryableGeminiError(new Error("403 Forbidden")), false);
    assert.equal(isRetryableGeminiError(new Error("SAFETY violation")), false);
    assert.equal(isRetryableGeminiError(null), false);

    console.log("✔ isRetryableGeminiError tests passed!");

    // 2. Test retry on same model succeeding on 2nd attempt
    let model1Calls = 0;
    const mockGenAISucceedOn2nd: any = {
        getGenerativeModel: () => ({
            generateContent: async () => {
                model1Calls++;
                if (model1Calls === 1) {
                    throw new Error("503 Service Unavailable");
                }
                return {
                    response: Promise.resolve({
                        text: () => "Recovered on attempt 2"
                    })
                };
            }
        })
    };

    const res2 = await generateWithRetry(mockGenAISucceedOn2nd, "prompt", {
        retryDelays: [10, 10, 10],
    });
    assert.equal(model1Calls, 2);
    assert.equal((await res2.response).text(), "Recovered on attempt 2");
    console.log("✔ Auto-retry on same model passed!");

    // 3. Test retry exhaustion and fallback to secondary model
    let attemptsOnModel1 = 0;
    let attemptsOnModel2 = 0;

    const mockGenAIFallback: any = {
        getGenerativeModel: ({ model }: { model: string }) => {
            return {
                generateContent: async () => {
                    if (model === "gemini-3.8-flash") {
                        attemptsOnModel1++;
                        throw new Error("503 Service Unavailable: This model is currently experiencing high demand");
                    }
                    if (model === "gemini-3.8-flash-lite") {
                        attemptsOnModel2++;
                        return {
                            response: Promise.resolve({
                                text: () => "OK from fallback model"
                            })
                        };
                    }
                    throw new Error("Unexpected model: " + model);
                }
            };
        }
    };

    const result = await generateWithRetry(mockGenAIFallback, "test prompt", {
        retryDelays: [5, 5, 5],
        primaryModel: "gemini-3.8-flash",
        fallbackModels: ["gemini-3.8-flash-lite"]
    });

    assert.equal(attemptsOnModel1, 4); // initial + 3 retries
    assert.equal(attemptsOnModel2, 1); // fallback model succeeded on first attempt
    assert.equal(result.usedModel, "gemini-3.8-flash-lite");

    const response = await result.response;
    assert.equal(response.text(), "OK from fallback model");
    console.log("✔ Model fallback chain passed!");

    // 4. Test non-retryable error failing fast without retry
    let nonRetryableCalls = 0;
    const mockGenAINonRetryable: any = {
        getGenerativeModel: () => ({
            generateContent: async () => {
                nonRetryableCalls++;
                throw new Error("API_KEY_INVALID: 403 Forbidden");
            }
        })
    };

    let threwError = false;
    try {
        await generateWithRetry(mockGenAINonRetryable, "prompt", {
            retryDelays: [5, 5, 5]
        });
    } catch (e: any) {
        threwError = true;
        assert.ok(e.message.includes("API_KEY_INVALID"));
    }
    assert.equal(threwError, true);
    assert.equal(nonRetryableCalls, 1); // Should fail immediately without retrying
    console.log("✔ Non-retryable error fail-fast passed!");

    console.log("\nALL GEMINI RETRY & FALLBACK TESTS PASSED SUCCESSFULLY! 🚀");
}

runTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
