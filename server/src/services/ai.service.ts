import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateStandaloneQuery(query: string, history: any[]): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite" });

    const historyText = history.map(m => `${m.role === 'user' ? 'Юзер' : 'Бот'}: ${m.content}`).join('\n');

    const prompt = `
    Історія діалогу:
    ${historyText}

    Поточний запит користувача: "${query}"

    Завдання:
    1. Перевір, чи є поточний запит "маячнею" (набір літер, випадкові символи, беззмістовний текст). 
       Якщо так — поверни ТІЛЬКИ слово "GIBBERISH".
    2. Якщо це адекватний запит — перепиши його так, щоб він був зрозумілим без контексту історії.
       (Приклад: "найдорожчий" -> "найдорожчий ноутбук", якщо в історії мова про ноутбуки).
    
    Відповідай ТІЛЬКИ переписаним запитом або словом "GIBBERISH". Ніяких пояснень.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

export async function generateRecommendation(query: string, products: any[]): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite" });

    const productInfo = products.map(p => `- ${p.name} (ціна: ${p.price}$)`).join('\n');
    
    const prompt = `

    Користувач шукав: "${query}"
    Знайдені товари:
    ${productInfo}
    
    Інструкція:
    1. Якщо запит користувача — це набір літер або маячня, а товари в списку не мають нічого спільного з ними (низька релевантність) -> напиши: "Я не можу знайти товарів за цим запитом."
    2. Якщо запит релевантний -> напиши ввічливу відповідь, базуючись ТІЛЬКИ на цих товарах.
    3. НЕ вигадуй товари, яких немає в списку.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
}