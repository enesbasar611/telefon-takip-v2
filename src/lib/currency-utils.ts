"use client";

const CACHE_KEY = "usd_exchange_rate";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getExchangeRate(): Promise<number> {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { rate, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return rate;
            }
        }

        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        const rate = data.rates.TRY;

        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
        return rate;
    } catch (error) {
        console.error("Exchange rate fetch failed:", error);
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached).rate;
        }
        return 35.0; // Fallback
    }
}
