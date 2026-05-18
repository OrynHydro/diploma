import { Router, type Request, type Response } from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js'
import { requireAuth } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { productId, rating, text, userName } = req.body;
        const userId = req.userId;

        if (!productId || !rating || !text) {
            return res.status(400).json({ message: "Заповніть усі обов'язакові поля" });
        }

        const review = new Review({
            product: productId,
            user: userId,
            userName: userName || 'Анонімний покупець',
            rating: Number(rating),
            text
        });
        await review.save();

        const reviews = await Review.find({ product: productId });

        const numReviews = reviews.length;
        const avgRating = Number((reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews).toFixed(1));

        await Product.findByIdAndUpdate(productId, {
            rating: avgRating,
            numReviews: numReviews
        });

        return res.status(201).json({
            review,
            updatedRating: avgRating,
            updatedNumReviews: numReviews
        });

    } catch (error: any) {
        return res.status(500).json({ message: "Не вдалося додати відгук", error: error.message });
    }
});

router.get('/my-reviews', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Користувач не авторизований або ID відсутній" });
        }

        const reviews = await Review.find({ 
            user: userId 
        })
        .populate('product', 'name image price') 
        .sort({ createdAt: -1 });

        return res.status(200).json(reviews);
    } catch (error: any) {
        console.error('Get user reviews error:', error);
        return res.status(500).json({ message: "Помилка сервера при отриманні відгуків" });
    }
});

router.get('/:productId', async (req: Request, res: Response) => {
    try {
        const productIdStr = req.params.productId as string;

        if (!productIdStr || !mongoose.Types.ObjectId.isValid(productIdStr)) {
            return res.status(400).json({ message: "Невалідний ID товару" });
        }

        const reviews = await Review.find({ 
            product: productIdStr 
        } as any).sort({ createdAt: -1 });
        
        return res.status(200).json(reviews);
    } catch (error: any) {
        console.error('Get reviews error:', error);
        return res.status(500).json({ message: "Помилка сервера" });
    }
});



export default router;