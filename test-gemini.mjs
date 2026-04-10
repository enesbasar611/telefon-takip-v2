import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("HATA: GEMINI_API_KEY çevre değişkeni bulunamadı.");
    process.exit(1);
}

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Listedeki tam ismi kullanıyoruz
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        console.log("Gemini SDK ile istek gönderiliyor (gemini-2.5-flash)...");
        const prompt = "Say {'ok':true} as JSON only";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Başarılı!", text);
    } catch (error) {
        console.error("HATA:", error.message);
    }
}

test();
