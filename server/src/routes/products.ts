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
router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query, userId, guestId } = req.body;
        let effectiveUserId = userId;

        if (!effectiveUserId && guestId) {
            let guest = await User.findOne({ guestId });
            if (!guest) {
                guest = new User({ guestId, isGuest: true });
                await guest.save();
            }
            effectiveUserId = guest._id;
        }

        if (!effectiveUserId) return res.status(400).json({ error: "Ідентифікатор користувача обов'язковий" });

        const chat = await Chat.findOne({ userId: effectiveUserId }); 
        const history = chat ? chat.messages.slice(-6) : [];

        const aiData = await generateStandaloneQuery(query, history);

        if (aiData.isGibberish) {
            const fallbackMsg = "Я не можу знайти товарів за цим запитом.";
            await addMessageToChat(effectiveUserId, 'user', query);
            await addMessageToChat(effectiveUserId, 'assistant', fallbackMsg);
            return res.json({ answer: fallbackMsg, products: [] });
        }

        const queryVector = await generateEmbedding(aiData.searchQuery);
        
        const pipeline: any[] = [
            { 
                $vectorSearch: { 
                    index: "vector_index", 
                    path: "vectorEmbedding", 
                    queryVector, 
                    numCandidates: 100, 
                    limit: 10
                } 
            }
        ];

        const matchStage: any = {};
        
        if (aiData.excludeCategory) {
            matchStage.category = { $ne: aiData.excludeCategory };
        }
        
        if (aiData.preferredCategory) {
            matchStage.category = aiData.preferredCategory;
        }

        if (aiData.onlyWithDiscounts) {
            matchStage.discount = { $gt: 0 }; 
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push({ 
            $project: { 
                name: 1, 
                price: 1, 
                brand: 1, 
                category: 1, 
                description: 1,
                image: 1,
                score: { $meta: "vectorSearchScore" } 
            } 
        });

        const searchResults = await Product.aggregate(pipeline);

        const answer = await generateRecommendation(aiData.searchQuery, searchResults, history);

        await addMessageToChat(effectiveUserId, 'user', query);

        const isNotFound = answer.toLowerCase().includes('я не можу знайти');

        await addMessageToChat(
            effectiveUserId, 
            'assistant', 
            answer, 
            isNotFound ? [] : searchResults 
        );

        if (isNotFound) {
            return res.json({ answer, products: [] });
        }

        res.json({ answer, products: searchResults });

        if (answer.toLowerCase().includes('я не можу знайти')) {
            return res.json({ answer, products: [] });
        }

        res.json({ answer, products: searchResults });

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
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


export default router;