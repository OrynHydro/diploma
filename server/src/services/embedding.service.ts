import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim() === "") {
        console.warn("[AI] Отримано порожній текст для ембеддінгу. Повертаємо нульовий вектор.");
        return new Array(3072).fill(0); 
    }

    try {
        const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
        const result = await model.embedContent(text);
        
        return result.embedding.values;
    } catch (error) {
        console.error("[AI] Помилка при генерації:", error);
        return new Array(3072).fill(0); 
    }
}