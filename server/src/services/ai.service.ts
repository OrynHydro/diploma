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

    for (const modelName of MODEL_PRIORITY) {
        let timeoutId: any;
        try {
            console.log(`\x1b[36m[AI] Спроба запиту до моделі:\x1b[0m ${modelName}`);
            
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('AI_TIMEOUT'));
                }, 10000);
            });

            const result = await Promise.race([
                model.generateContent(prompt),
                timeoutPromise
            ]) as any;

            clearTimeout(timeoutId);

            const response = await result.response;
            const text = response.text();
            
            if (text && text.trim().length > 0) {
                console.log(`\x1b[32m[AI] Успішна відповідь від:\x1b[0m ${modelName}`);
                return text.trim();
            }

        } catch (error: any) {
            if (timeoutId) clearTimeout(timeoutId);
            
            lastError = error;
            const isTimeout = error.message === 'AI_TIMEOUT';
            
            console.warn(
                `\x1b[31m[AI] Помилка на моделі ${modelName}:\x1b[0m`, 
                isTimeout ? 'TIMEOUT (10s)' : (error.status || error.message)
            );

            if (error.status === 401 || error.status === 403) {
                console.error("[AI] Критична помилка ключа API. Зупиняємо каскад.");
                break;
            }

            console.log(`[AI] Перемикаємось на наступну модель у списку...`);
            continue; 
        }
    }

    console.error("\x1b[41m[AI] ВСІ МОДЕЛІ ВІДМОВИЛИ\x1b[0m. Останній лог:", lastError?.message);
    return "GIBBERISH";
}

export async function generateStandaloneQuery(query: string, history: any[]): Promise<any> {
    const historyText = history.map(m => `${m.role === 'user' ? 'Юзер' : 'Бот'}: ${m.content}`).join('\n');

    const prompt = `
    Історія діалогу:
    ${historyText}

    Поточний запит користувача: "${query}"

    Завдання: Перетвори запит у JSON об'єкт для пошуку в базі товарів.
    Категорії: ['Laptops', 'Monitors', 'Audio', 'Components', 'Networking', 'Gaming', 'Smartphones']

    Поля JSON:
    1. "searchQuery": (string) переписаний запит для векторного пошуку.
    2. "excludeCategory": (string|null) категорія, яку юзер НЕ хоче бачити (напр. "крім ноутбуків").
    3. "preferredCategory": (string|null) категорія, яку юзер явно шукає.
    4. "isGibberish": (boolean) чи є запит маячнею.
    5. "onlyWithDiscounts": (boolean) чи шукає користувач акційні товари.

    Приклад: "Покажи щось крім ноутів" -> {"searchQuery": "техніка та периферія", "excludeCategory": "Laptops", "preferredCategory": null, "isGibberish": false}

    Поверни ТІЛЬКИ JSON.`;

    const response = await generateWithFallback(prompt);

    console.log(response)

    if (response === "GIBBERISH") return { isGibberish: true };

    try {
        const cleanJson = response.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Помилка парсингу JSON від AI:", response);
        return { searchQuery: query, isGibberish: false };
    }
}

export async function generateRecommendation(query: string, products: any[], history: any[]): Promise<string> {
    const productInfo = products.length > 0 
        ? products.map(p => `- ${p.brand} ${p.name} (${p.category}, ціна: ${p.price}$): ${p.description}`).join('\n')
        : "Товарів не знайдено";

    const historyText = history.map(m => `${m.role === 'user' ? 'Юзер' : 'Бот'}: ${m.content}`).join('\n');
    
    const prompt = `
    Ти — інтелектуальний асистент магазину електроніки. 
    
    КОНТЕКСТ ДІАЛОГУ:
    ${historyText}

    ПОТОЧНИЙ ЗАПИТ: "${query}"
    
    ЗНАЙДЕНІ ТОВАРИ В БАЗІ:
    ${productInfo}
    
    ІНСТРУКЦІЯ:
    1. Проаналізуй історію. Якщо ви вже спілкуєтесь, НЕ ПРИВІТЙСЯ знову. 
    2. Дай коротку, ввічливу пораду на основі знайдених товарів.
    3. Обов'язково згадуй бренди.
    4. Якщо користувач просив "щось крім ноутів" (як видно з історії або запиту), підтвердь, що ти знайшов саме альтернативи.
    5. Якщо товарів немає — запропонуй уточнити запит.
    
    Відповідай природно, як людина, що продовжує розмову.`;

    try {
        const response = await generateWithFallback(prompt);
        
        if (!response || response === "GIBBERISH") {
            return "Наразі я не можу знайти варіанти, що точно відповідають вашому запиту.";
        }
        
        return response;
    } catch (error) {
        console.error("Помилка в generateRecommendation:", error);
        return "Я знайшов чудові варіанти, але виникла помилка при описі. Спробуйте ще раз.";
    }
}