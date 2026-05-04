import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateRecommendation(query: string, products: any[]): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    
    if (products.length === 0) {
        return "На жаль, я не знайшов товарів, які б відповідали вашому запиту. Спробуйте уточнити пошук.";
    }

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