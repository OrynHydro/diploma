import { Router } from 'express';
import type { Request, Response } from 'express';
import User, { type IUserDocument } from '../models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.middleware.js';

dotenv.config({ path: '.env.local' });

const router = Router();

const secretKeyAccess = process.env.JWT_SECRET_ACCESS!;
const secretKeyRefresh = process.env.JWT_SECRET_REFRESH!;

router.post('/', async (req: Request, res: Response) => {
    try {
        const { password, guestId, ...userData } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        let dbUser;

        if (guestId) {
            dbUser = await User.findOne({ guestId });
        }

        if (dbUser) {
            dbUser.phone = userData.phone;
            dbUser.password = hashPassword;
            dbUser.isGuest = false;
            await dbUser.save();
        } else {
            const user = new User({
                ...userData,
                password: hashPassword,
                isGuest: false
            });
            dbUser = await user.save();
        }

        const accessToken = jwt.sign(
            { userId: dbUser._id, role: dbUser.role }, 
            secretKeyAccess, 
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign({ userId: dbUser._id, role: dbUser.role }, secretKeyRefresh, { expiresIn: '14d' });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({ 
            message: `User ${dbUser._id} ${guestId ? 'converted' : 'created'}`,
            user: { id: dbUser._id, phone: dbUser.phone } 
        });

    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Користувач з таким номером вже існує" });
        }
        return res.status(500).json({ message: "Сталася помилка на сервері", error: error.message });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone }) as IUserDocument | null; 
        if (!user) {
            return res.status(401).json({ message: "Неправильний телефон або пароль" });
        }

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            return res.status(401).json({ message: "Неправильний телефон або пароль" });
        }

        const accessToken = jwt.sign(
            { userId: user._id, role: user.role }, 
            secretKeyAccess, 
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign({ userId: user._id, role: user.role }, secretKeyRefresh, { expiresIn: '14d' });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, 
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 14 * 24 * 60 * 60 * 1000, 
        });

        return res.status(200).json({ 
            message: "Login successful", 
            user: { 
                id: user._id, 
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email 
            } 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Помилка сервера" });
    }
});

router.get('/get-by-token', requireAuth, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Помилка сервера" });
    }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: { firstName, lastName, email } },
            { 
                returnDocument: 'after', 
                runValidators: true 
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        return res.status(200).json(updatedUser);

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: "Помилка сервера", error: error.message });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: "Вихід виконано" });
});

export default router;