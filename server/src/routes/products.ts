import { Router } from 'express'
import type { Request, Response } from 'express'
import Product from '../models/Product.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { generateRecommendation, generateStandaloneQuery } from '../services/ai.service.js';
import { z } from 'zod';
import { Chat } from '../models/Chat.js';
import { addMessageToChat } from '../services/chat.service.js';
import User from '../models/User.js'

const router = Router();

// create product
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, specs, price } = req.body;

        const textToEmbed = `${name} ${JSON.stringify(specs)}`;

        const vectorEmbedding = await generateEmbedding(textToEmbed);

        const newProduct = new Product({
            name,
            specs,
            price,
            vectorEmbedding
        });

        await newProduct.save();
        res.status(201).json({ message: "Товар успішно створено", product: newProduct });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Помилка при створенні товару" });
    }
});

const SearchSchema = z.object({
  query: z.string().min(1).max(500)
});

function needsRewriting(query: string): boolean {
    const triggers = [
    'дешевше', 'дорожче', 'кращий', 'гірший', 'потужніший', 'слабший', 
    'швидший', 'повільніший', 'більший', 'менший', 'компактніший', 
    'економніший', 'оптимальніший', 'вигідніший', 'надійніший',

    'цей', 'той', 'такий самий', 'аналогічний', 'подібний', 
    'попередній', 'наступний', 'перший', 'останній', 'такий',

    'а ще', 'також', 'ще', 'крім того', 'замість', 'теж', 
    'натомість', 'наприклад', 'про цей', 'про той',

    'а як щодо', 'чи є', 'який з них', 'чому він', 'який краще', 
    'а скільки', 'а він', 'а в нього'
];
    const isShort = query.split(' ').length < 4;
    
    return isShort || triggers.some(t => query.toLowerCase().includes(t));
}

// search for products
router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query, userId, guestId } = req.body;

         let effectiveUserId = userId;

        if (!effectiveUserId && guestId) {
            let guest = await User.findOne({ guestId });
            if (!guest) {
                guest = new User({ 
                    guestId, 
                    isGuest: true,
                    phone: undefined 
                });
                await guest.save();
            }
            effectiveUserId = guest._id;
        }

        if (!effectiveUserId) {
            return res.status(400).json({ error: "Необхідно вказати ідентифікатор користувача" });
        }

        // zod parser
        const result = SearchSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ error: "Некоректний запит" });  
        
        // chat history
        const chat = await Chat.findOne({ userId: effectiveUserId }); 
        const history = chat ? chat.messages.slice(-6) : [];

        let standaloneQuery = query;


        // rewriting query according to context 
        if (needsRewriting(query) && history.length > 0) {
             standaloneQuery = await generateStandaloneQuery(query, history);
        }


        // checking if query is gibberish 
        if (standaloneQuery === 'GIBBERISH') {
            await addMessageToChat(userId, 'user', query);
            const fallbackMsg = "Я не можу знайти товарів за цим запитом.";
            await addMessageToChat(userId, 'assistant', fallbackMsg);
            return res.json({ answer: fallbackMsg, products: [] });
        }


        // vectorizing user query 
        const queryVector = await generateEmbedding(standaloneQuery);
        const searchResults = await Product.aggregate([
            { $vectorSearch: { index: "vector_index", path: "vectorEmbedding", queryVector, numCandidates: 100, limit: 3 } },
            { $project: { name: 1, price: 1, score: { $meta: "vectorSearchScore" } } }
        ]);

        console.log(searchResults)

        // generating answer according to results
        const answer = await generateRecommendation(query, searchResults);


        // adding messages to chat
        await addMessageToChat(effectiveUserId, 'user', query)
        await addMessageToChat(effectiveUserId, 'assistant', answer)

        // another check
        if (answer.toLowerCase().includes('я не можу знайти')) {
            return res.json({ answer, products: [] });
            
        }

        // response
        res.json({ answer, products: searchResults });
    } catch (error) {
        res.status(500).json(error);
        console.log(error)
    }
});

export default router;