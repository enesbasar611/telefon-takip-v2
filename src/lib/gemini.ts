import {
    GoogleGenerativeAI,
    type GenerateContentResult,
    type GenerationConfig,
    type SafetySetting,
} from "@google/generative-ai";

/**
 * Fallback chain of Gemini models when high-demand (503) or rate-limit (429) errors occur.
 * Primary: gemini-3.8-flash
 * Fallbacks: gemini-3.8-flash-lite, gemini-2.5-flash-lite, gemini-2.0-flash
 */
export const DEFAULT_GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.8-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
] as const;

export type SupportedGeminiModel = typeof DEFAULT_GEMINI_MODELS[number] | string;

/**
 * Default retry delays in milliseconds:
 * 1st retry: 800ms
 * 2nd retry: 1600ms
 * 3rd retry: 3000ms
 */
export const DEFAULT_RETRY_DELAYS_MS = [800, 1600, 3000];

export interface GenerateWithRetryOptions {
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
    primaryModel?: string;
    fallbackModels?: string[];
    retryDelays?: number[];
    onRetry?: (info: { model: string; attempt: number; delayMs: number; error: any }) => void;
    onModelFallback?: (info: { failedModel: string; nextModel: string; error: any }) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks whether an error from Google Gemini is a transient / retryable error
 * such as 503 Service Unavailable (high demand), 429 Too Many Requests, or temporary capacity drops.
 */
export function isRetryableGeminiError(error: any): boolean {
    if (!error) return false;
    const msg = (
        typeof error === "string"
            ? error
            : `${error?.message || ""} ${error?.status || ""} ${error?.statusText || ""} ${error?.code || ""}`
    ).toLowerCase();

    return (
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("overloaded") ||
        msg.includes("high demand") ||
        msg.includes("service unavailable") ||
        msg.includes("resource has been exhausted") ||
        msg.includes("resource_exhausted") ||
        msg.includes("rate limit") ||
        msg.includes("temporarily unavailable") ||
        msg.includes("try again later") ||
        msg.includes("econnreset") ||
        msg.includes("etimedout") ||
        msg.includes("fetch failed")
    );
}

/**
 * Executes a Gemini generateContent request with automatic retry (exponential backoff)
 * and seamless fallback across backup models if the primary model is experiencing high demand (503).
 */
export async function generateWithRetry(
    clientOrKey: GoogleGenerativeAI | string,
    promptParts: any,
    options: GenerateWithRetryOptions = {}
): Promise<GenerateContentResult & { usedModel: string }> {
    const genAI = typeof clientOrKey === "string" ? new GoogleGenerativeAI(clientOrKey) : clientOrKey;

    const primaryModel = options.primaryModel || DEFAULT_GEMINI_MODELS[0];
    const userFallbacks = options.fallbackModels || DEFAULT_GEMINI_MODELS.filter((m) => m !== primaryModel);
    const modelsToTry = [primaryModel, ...userFallbacks.filter((m) => m !== primaryModel)];
    const delays = options.retryDelays || DEFAULT_RETRY_DELAYS_MS;

    let lastError: any = null;

    for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
        const currentModelName = modelsToTry[mIdx];
        const nextModelName = modelsToTry[mIdx + 1];

        const model = genAI.getGenerativeModel({
            model: currentModelName,
            generationConfig: options.generationConfig,
            safetySettings: options.safetySettings,
        });

        // Try current model with retries
        for (let attempt = 0; attempt <= delays.length; attempt++) {
            try {
                const result = await model.generateContent(promptParts);
                return Object.assign(result, { usedModel: currentModelName });
            } catch (err: any) {
                lastError = err;
                const isRetryable = isRetryableGeminiError(err);

                // If non-retryable error (e.g. 400 Bad Request, 403 Invalid API Key, SAFETY violation), fail fast
                if (!isRetryable) {
                    throw err;
                }

                // If we still have retry attempts remaining for this model:
                if (attempt < delays.length) {
                    const delay = delays[attempt];
                    console.warn(
                        `[Gemini Auto-Retry] Model '${currentModelName}' encountered transient error (${err?.message || err}). Retrying in ${delay}ms (attempt ${attempt + 1}/${delays.length})...`
                    );
                    options.onRetry?.({
                        model: currentModelName,
                        attempt: attempt + 1,
                        delayMs: delay,
                        error: err,
                    });
                    await sleep(delay);
                } else {
                    // Retries exhausted for the current model
                    if (nextModelName) {
                        console.warn(
                            `[Gemini Fallback] Model '${currentModelName}' failed after ${delays.length} retries. Switching to fallback model '${nextModelName}'...`
                        );
                        options.onModelFallback?.({
                            failedModel: currentModelName,
                            nextModel: nextModelName,
                            error: err,
                        });
                    }
                }
            }
        }
    }

    // All models and retries failed
    throw lastError;
}

