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

// bulk create products
router.post('/bulk', async (req: Request, res: Response) => {
    try {
        const productsData = req.body; 

        if (!Array.isArray(productsData)) {
            return res.status(400).json({ error: "Очікується масив товарів" });
        }

        const productsToSave = await Promise.all(
            productsData.map(async (item) => {
                const { name, brand, category, description, price, image, specs, discount } = item;

                const textToEmbed = `
                    Товар: ${brand} ${name}
                    Категорія: ${category}
                    Опис: ${description}
                    Характеристики: ${JSON.stringify(specs)}
                `.trim();
                
                const vectorEmbedding = await generateEmbedding(textToEmbed);

                return {
                    name,
                    brand,
                    category,
                    description,
                    price,
                    image,
                    specs,
                    discount: discount || 0,
                    inStock: true, 
                    vectorEmbedding
                };
            })
        );

        const createdProducts = await Product.insertMany(productsToSave);

        res.status(201).json({ 
            message: `Успішно додано ${createdProducts.length} товарів з категоріями та зображеннями`, 
            count: createdProducts.length 
        });

    } catch (error) {
        console.error("Bulk create error:", error);
        res.status(500).json({ error: "Помилка при масовому створенні товарів" });
    }
});

// search for products with ai
router.post('/ai-search', async (req: Request, res: Response) => {
    const start = Date.now();
    try {
        const { query, userId, guestId } = req.body;
        let effectiveUserId = userId;

        // 1. Робота з гостем
        if (!effectiveUserId && guestId) {
            let guest = await User.findOne({ guestId });
            if (!guest) {
                guest = new User({ guestId, isGuest: true });
                await guest.save();
            }
            effectiveUserId = guest._id;
        }

        if (!effectiveUserId) return res.status(400).json({ error: "Ідентифікатор обов'язковий" });

        // 2. Отримання історії
        const chat = await Chat.findOne({ userId: effectiveUserId }); 
        const history = chat ? chat.messages.slice(-6) : [];

        // 3. AI Обробка запиту
        const aiData = await generateStandaloneQuery(query, history);

        if (aiData.isGibberish) {
            const fallbackMsg = "Я не можу знайти товарів за цим запитом.";
            await addMessageToChat(effectiveUserId, 'user', query);
            await addMessageToChat(effectiveUserId, 'assistant', fallbackMsg, []);
            return res.json({ answer: fallbackMsg, products: [] });
        }

        // 4. Формування вбудованого мета-фільтра (Варіант 1 з $match для безпеки та гнучкості)
        const matchStage: any = {};

        if (aiData.preferredCategory) {
            matchStage.category = aiData.preferredCategory;
        } else if (aiData.excludeCategory) {
            matchStage.category = { $ne: aiData.excludeCategory };
        }

        if (aiData.brand) {
            matchStage.brand = { $regex: new RegExp(`^${aiData.brand}$`, 'i') };
        }

        if (aiData.maxPrice) {
            matchStage.price = { $lte: aiData.maxPrice };
        }

        if (aiData.onlyWithDiscounts) {
            matchStage.discount = { $gt: 0 };
        }

        // 5. Побудова конвеєру агрегації з ЛІМІТОМ ТОП-4
        const queryVector = await generateEmbedding(aiData.searchQuery);
        
        const pipeline: any[] = [
            { 
                $vectorSearch: { 
                    index: "vector_index", 
                    path: "vectorEmbedding", 
                    queryVector, 
                    numCandidates: 50, 
                    limit: 4 
                } 
            }
        ];

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push({ 
            $project: { 
                name: 1, price: 1, brand: 1, category: 1, 
                description: 1, image: 1, discount: 1, specs: 1,
                score: { $meta: "vectorSearchScore" } 
            } 
        });

        // Виконуємо пошук
        const searchResults = await Product.aggregate(pipeline);
        console.log(`[AI Search] Знайдено товарів після фільтрації базою: ${searchResults.length}`);

        // 6. Генерація текстової рекомендації
        const answer = await generateRecommendation(query, searchResults, history);
        
        // КРОК 3: Пост-фільтрація карток. Залишаємо суто те, що бот РЕАЛЬНО згадав у тексті відповіді
        const finalMatchedProducts = searchResults.filter(product => {
            const nameInAnswer = answer.toLowerCase().includes(product.name.toLowerCase());
            const brandInAnswer = answer.toLowerCase().includes(product.brand.toLowerCase());
            return nameInAnswer || brandInAnswer;
        });

        const isNotFound = finalMatchedProducts.length === 0 || answer.toLowerCase().includes('я не можу знайти');
        const finalProducts = isNotFound ? [] : finalMatchedProducts;

        // 7. Збереження історії в БД
        await addMessageToChat(effectiveUserId, 'user', query);
        await addMessageToChat(effectiveUserId, 'assistant', answer, finalProducts);

        console.log(`Search took: ${Date.now() - start}ms`);

        // 8. Відповідь клієнту
        return res.json({ 
            answer, 
            products: finalProducts 
        });

    } catch (error) {
        console.error("Search error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Внутрішня помилка сервера" });
        }
    }
});

// get all products
router.get('/', async (req: Request, res: Response) => {
    try {
        const products = await Product.find({}).select('-vectorEmbedding');

        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Товари не знайдені" });
        }

        res.json(products);
    } catch (error) {
        console.error("Помилка при отриманні товарів:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// search by query
router.get('/standart-search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q;

        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(200).json([]);
        }

        const searchStr = query.trim();
        const escapedQuery = searchStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

        const products = await Product.find({
            $or: [
                { name: { $regex: escapedQuery, $options: 'i' } },
                { brand: { $regex: escapedQuery, $options: 'i' } } 
            ]
        });
        
        return res.status(200).json(products);

    } catch (error: any) {
        console.error('Search error:', error.message);
        return res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
});

// get product by id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id).select('-vectorEmbedding');
        if (!product) return res.status(404).json({ message: "Товар не знайдено" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});




export default router;