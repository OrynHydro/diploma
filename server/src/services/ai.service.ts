import { Router } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
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
    const розширенийКонтекст = history.slice(-3);
    const historyText = розширенийКонтекст.map(m => `${m.role === 'user' ? 'Юзер' : 'Бот'}: ${m.content}`).join('\n');

    const prompt = `
    Історія діалогу (останні репліки):
    ${historyText}

    Поточний запит користувача: "${query}"

    Завдання: Перетвори поточний запит у строгий JSON об'єкт для фільтрації бази товарів.
    Категорії магазину: ['Laptops', 'Monitors', 'Audio', 'Components', 'Networking', 'Gaming', 'Smartphones']

    Поля JSON:
    1. "searchQuery": (string) ключові слова для пошуку (очищені від сполучників та зайвих брендів).
    2. "preferredCategory": (string|null) категорія, яку юзер явно шукає на основі контексту.
    3. "excludeCategory": (string|null) категорія, яку треба виключити.
    4. "brand": (string|null) конкретний бренд, якщо користувач звузив пошук (напр. "Acer", "Apple", "ASUS").
    5. "maxPrice": (number|null) верхня межа ціни, якщо юзер просить "дешевше", "не найдорожчий", або абстрактні рамки.
    6. "onlyWithDiscounts": (boolean) пошук акційних товарів.
    7. "isGibberish": (boolean) чи є запит повним офтопом/маячнею.
    8. "minRating": (number|null) мінімальний рейтинг (від 1 до 5).

    КРИТИЧНІ ПРАВИЛА ДЛЯ ЦІНИ (maxPrice):
    - Якщо користувач шукає ПОТУЖНИЙ девайс (ігровий ноут, робоча станція), але пише абстрактні фрази на кшталт "не за всі гроші світу", "не найдорожчий", "адекватна ціна" при першому ж запиті — залізобетонно установи "maxPrice": 2200. Це допоможе зрізати оверпрайс преміум сегмент (на кшталт Mac Pro за 3500$).
    - Якщо користувач пише "бюджетний", "недорогий", "дешевий" — установи "maxPrice": 800.
    - Якщо користувач пише "Acer" або обирає бренд після того, як бот запропонував варіанти, обов'язково передай бренд у поле "brand", а в "searchQuery" залиш тільки суть запиту без інших брендів.

    КРИТИЧНІ ПРАВИЛА ДЛЯ РЕЙТИНГУ (minRating):
    - Якщо юзер каже "найкращі", "топові", "рейтингові", "з найвищою оцінкою", "якість" — встанови "minRating": 4.5.
    - Якщо юзер каже "хороші", "надійні" — встанови "minRating": 4.0.
    - Якщо запит загальний ("найкращі пропозиції"), AI може самостійно вирішити, чи застосовувати фільтр, але краще надати йому вибір.
    - ЯКЩО в запиті НЕМАЄ конкретної назви товару (напр. "найкращі пропозиції", "що зараз вигідно"), встанови "searchQuery": "найкращі товари".

    Поверни ТІЛЬКИ чистий JSON об'єкт. Без маркдауну та зайвих слів.`;

    const response = await generateWithFallback(prompt);

    if (response === "GIBBERISH") return { isGibberish: true };

    try {
        const cleanJson = response.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        
        console.log("[AI Query Parser] Результат:", parsed);
        return parsed;
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
        return "Я знайшов чудові варіанти, але ви виникла помилка при описі. Спробуйте ще раз.";
    }
}
