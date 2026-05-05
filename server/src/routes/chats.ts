import { Router } from 'express'
import type { Request, Response } from 'express'
import { Chat } from '../models/Chat.js'

const router = Router()

// get chat
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const chat = await Chat.findOne({ userId });
        
        res.json(chat ? chat.messages : []);
    } catch (error) {
        res.status(500).json({ error: "Помилка завантаження історії" });
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