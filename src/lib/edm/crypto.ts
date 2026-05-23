import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey(): string {
    const key = process.env.EDM_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("EDM_ENCRYPTION_KEY .env dosyasinda tanimli degil.");
    }
    if (key.length !== 32) {
        throw new Error(`EDM_ENCRYPTION_KEY 32 karakter olmali. Mevcut: ${key.length} karakter.`);
    }
    return key;
}

export function encrypt(text: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return iv.toString("base64") + ":" + encrypted;
}

export function decrypt(encrypted: string): string {
    const key = getKey();
    const parts = encrypted.split(":");
    if (parts.length !== 2) {
        throw new Error("Gecersiz sifreli metin formati.");
    }
    const iv = Buffer.from(parts[0], "base64");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
