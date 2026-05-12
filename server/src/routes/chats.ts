import { Router } from 'express'
import type { Request, Response } from 'express'
import { Chat } from '../models/Chat.js'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import dotenv from 'dotenv'

const router = Router()
dotenv.config({ path: '.env.local' })

const secretKeyAccess = process.env.JWT_SECRET_ACCESS!

// get chat
router.get('/', async (req: Request, res: Response) => {
    try {
        const accessToken = req.cookies['accessToken'];
        const guestId = req.query.guestId as string;
        let userId: string | null = null;

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, secretKeyAccess) as { userId: string };
                userId = decoded.userId;
            } catch (e) {  }
        }

        if (!userId && guestId) {
            const guest = await User.findOne({ guestId });
            if (guest) userId = guest._id.toString();
        }

        if (!userId) {
            return res.json({ messages: [] });
        }

        const chat = await Chat.findOne({ userId }).populate('messages.products');
        res.json(chat ? chat.messages : []);

    } catch (error) {
        res.status(500).json({ message: "Ошибка загрузки чата" });
    }
});

// delete chat
router.delete('/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        
        const result = await Chat.deleteOne({ userId: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Чат не знайдено" });
        }

        res.status(200).json({ message: "Історію чату очищено" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Помилка при видаленні" });
    }
});

export default router