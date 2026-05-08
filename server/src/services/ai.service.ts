import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const MODEL_PRIORITY = [
    "models/gemini-3.1-flash-lite-preview", 
    "models/gemini-2.5-flash",              
    "models/gemini-2.0-flash",              
    "models/gemini-2.0-flash-lite",      
];

async function generateWithFallback(prompt: string): Promise<string> {
    let lastError: any = null;

    const modelsToTry = [...MODEL_PRIORITY];

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI] Спроба запиту до моделі: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]) as any;

            const response = await result.response;
            const text = response.text();
            
            if (text && text.trim().length > 0) {
                return text.trim();
            }
            
            console.warn(`[AI] Модель ${modelName} повернула порожню відповідь.`);
            
        } catch (error: any) {
            lastError = error;
            const statusCode = error.status || error.response?.status;
            const errorMessage = error.message || "";

            console.warn(`[AI] Помилка на моделі ${modelName}: ${statusCode || errorMessage}`);

            if (statusCode === 429 || statusCode === 503 || errorMessage.includes('Timeout')) {
                continue; 
            }
            
            if (statusCode === 401 || statusCode === 403) {
                break;
            }
        }
    }

    console.error("[AI] Усі моделі відмовили.");
    
    return "GIBBERISH"; 
}

export async function generateStandaloneQuery(query: string, history: any[]): Promise<string> {
    const historyText = history.map(m => `${m.role === 'user' ? 'Юзер' : 'Бот'}: ${m.content}`).join('\n');

    const prompt = `
    Історія діалогу:
    ${historyText}

    Поточний запит користувача: "${query}"

    Завдання:
    1. Перевір, чи є поточний запит "маячнею" (набір літер, випадкові символи). Якщо так — поверни ТІЛЬКИ "GIBBERISH".
    2. Якщо адекватний — перепиши його, щоб він був зрозумілим без історії.
    
    Відповідай ТІЛЬКИ результатом. Ніяких пояснень.`;

    return await generateWithFallback(prompt);
}

export async function generateRecommendation(query: string, products: any[]): Promise<string> {
    const productInfo = products.length > 0 
        ? products.map(p => `- ${p.name} (ціна: ${p.price}$)`).join('\n')
        : "Товарів не знайдено";
    
    const prompt = `
    Користувач шукав: "${query}"
    Знайдені товари:
    ${productInfo}
    
    Інструкція:
    1. Якщо запит — маячня, а список товарів не релевантний -> "Я не можу знайти товарів за цим запитом."
    2. Якщо релевантний -> ввічлива відповідь ТІЛЬКИ на основі цих товарів.
    3. НЕ вигадуй нові товари.`;

    try {
        const response = await generateWithFallback(prompt);
        
        if (!response || response === "GIBBERISH") {
            return "Наразі я не можу сформувати рекомендацію.";
        }
        
        return response;
    } catch (error) {
        console.error("Помилка в generateRecommendation:", error);
        return "Я знайшов кілька варіантів, але зараз не можу детально їх описати.";
    }
}