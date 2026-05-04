import { Router } from 'express'
import type { Request, Response } from 'express'
import Product from '../models/Product.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { generateRecommendation } from '../services/ai.service.js';

const router = Router();

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

router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        
        const queryVector = await generateEmbedding(query);
        const searchResults = await Product.aggregate([
            { $vectorSearch: { index: "vector_index", path: "vectorEmbedding", queryVector, numCandidates: 100, limit: 3 } },
            { $project: { name: 1, price: 1, score: { $meta: "vectorSearchScore" } } }
        ]);


        const answer = await generateRecommendation(query, searchResults);

        if (answer === 'Я не можу знайти товарів за цим запитом.') {
            res.json({ answer, products: [] });
        }

        res.json({ answer, products: searchResults });
    } catch (error) {
        res.status(500).json({ error: "Помилка" });
        console.log(error)
    }
});

export default router;