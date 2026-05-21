import { Router } from 'express'
import type { Request, Response } from 'express'
import Product from '../models/Product.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { generateRecommendation, generateStandaloneQuery } from '../services/ai.service.js';
import { Chat } from '../models/Chat.js';
import { addMessageToChat } from '../services/chat.service.js';
import User from '../models/User.js'

const router = Router();

// search for products with ai
router.post('/ai-search', async (req: Request, res: Response) => {
    const start = Date.now();
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

        if (!effectiveUserId) return res.status(400).json({ error: "Ідентифікатор обов'язковий" });

        const chat = await Chat.findOne({ userId: effectiveUserId }); 
        const history = chat ? chat.messages.slice(-6) : [];

        const aiData = await generateStandaloneQuery(query, history);

        if (aiData.isGibberish) {
            const fallbackMsg = "Я не можу знайти товарів за цим запитом.";
            await addMessageToChat(effectiveUserId, 'user', query);
            await addMessageToChat(effectiveUserId, 'assistant', fallbackMsg, []);
            return res.json({ answer: fallbackMsg, products: [] });
        }

        const vectorFilter: any = {};

        if (aiData.preferredCategory) vectorFilter.category = aiData.preferredCategory;
        else if (aiData.excludeCategory) vectorFilter.category = { $ne: aiData.excludeCategory };

        if (aiData.minRating) vectorFilter.rating = { $gte: aiData.minRating };
        if (aiData.brand) vectorFilter.brand = { $regex: new RegExp(`^${aiData.brand}$`, 'i') };
        if (aiData.maxPrice) vectorFilter.price = { $lte: aiData.maxPrice };
        if (aiData.onlyWithDiscounts) vectorFilter.discount = { $gt: 0 };

        const pipeline: any[] = [];
        const queryVector = await generateEmbedding(aiData.searchQuery || "топ товарів");

        pipeline.push({ 
            $vectorSearch: { 
                index: "vector_index", 
                path: "vectorEmbedding", 
                queryVector, 
                numCandidates: 100, 
                limit: 8,
                filter: vectorFilter 
            } 
        });

        pipeline.push({ 
            $project: { 
                name: 1, price: 1, brand: 1, category: 1, 
                description: 1, image: 1, discount: 1, specs: 1,
                rating: 1,
                score: { $meta: "vectorSearchScore" } 
            } 
        });

        const searchResults = await Product.aggregate(pipeline);
        console.log(`[AI Search] Знайдено товарів: ${searchResults.length}`);

        const rankedProducts = searchResults.map(product => {
            let weight = product.score || 0; 
            
            if (aiData.brand && product.brand.toLowerCase() === aiData.brand.toLowerCase()) {
                weight += 0.2;
            }
            
            if (aiData.onlyWithDiscounts && product.discount > 0) {
                weight += 0.1;
            }

            return { ...product, weight };
        }).sort((a, b) => b.weight - a.weight); 

        const finalProducts = rankedProducts.slice(0, 4);

        const answer = await generateRecommendation(query, finalProducts, history);

        await addMessageToChat(effectiveUserId, 'user', query);
        await addMessageToChat(effectiveUserId, 'assistant', answer, finalProducts);

        console.log(`Search took: ${Date.now() - start}ms`);

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

router.get('/', async (req: Request, res: Response) => {
    try {
        const { cat, search, sort, limit } = req.query;
        let query: any = {};

        if (cat && cat !== 'All') {
            query.category = cat;
        }

        if (search && typeof search === 'string') {
            const escapedQuery = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            query.$or = [
                { name: { $regex: escapedQuery, $options: 'i' } },
                { brand: { $regex: escapedQuery, $options: 'i' } }
            ];
        }

        let sortQuery: any = {};
        if (sort === 'popular') {
            sortQuery = { rating: -1, numReviews: -1 };
        } else if (sort === 'newest') {
            sortQuery = { createdAt: -1 };
        }

        const limitNum = limit ? parseInt(limit as string) : 0;

        const products = await Product.find(query)
            .sort(sortQuery)
            .limit(limitNum)
            .select('-vectorEmbedding');
            
        res.json(products);
    } catch (error) {
        console.error("Помилка:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// get similar products
router.get('/:id/similar', async (req: Request, res: Response) => {
    try {
        const productId = req.params.id;
        
        const currentProduct = await Product.findById(productId);
        if (!currentProduct || !currentProduct.vectorEmbedding) {
            return res.status(404).json({ message: "Товар або його вектори не знайдені" });
        }

        const similarProducts = await Product.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", 
                    path: "vectorEmbedding",
                    queryVector: currentProduct.vectorEmbedding,
                    numCandidates: 50,
                    limit: 9
                }
            },
            { $match: { _id: { $ne: currentProduct._id } } }, 
            { $limit: 8 },
            { $project: { vectorEmbedding: 0 } }
        ]);

        res.json(similarProducts);
    } catch (error) {
        console.error("Similar products error:", error);
        res.status(500).json({ error: "Помилка при пошуку схожих товарів" });
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