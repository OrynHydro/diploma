import { Router } from 'express'
import type { Request, Response } from 'express'
import User, { type IUserDocument } from '../models/User.js'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import type {JwtPayload} from 'jsonwebtoken'
const router = Router()

dotenv.config({ path: '.env.local' })

const secretKeyAccess = process.env.JWT_SECRET_ACCESS!
const secretKeyRefresh = process.env.JWT_SECRET_REFRESH!

// create user
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

        const accessToken = jwt.sign({ userId: dbUser._id }, secretKeyAccess, {
            expiresIn: '1h',
        });
        const refreshToken = jwt.sign({ userId: dbUser._id }, secretKeyRefresh, {
            expiresIn: '14d',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // безпека для деплою
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({ 
            message: `User ${dbUser._id} ${guestId ? 'converted' : 'created'}`,
            user: { id: dbUser._id, phone: dbUser.phone } 
        });

    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Користувач з таким номером вже існує" });
        }

        res.status(500).json({ 
            message: "Сталася помилка на сервері", 
            error: error.message 
        });
    }
});

// login user
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

        const accessToken = jwt.sign({ userId: user._id }, secretKeyAccess, {
            expiresIn: '1h',
        });
        const refreshToken = jwt.sign({ userId: user._id }, secretKeyRefresh, {
            expiresIn: '14d',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000, 
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000, 
        });

        res.status(200).json({ message: "Login successful", userId: user._id });
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }
});

// get user from token
router.get('/get-by-token', async (req: Request, res: Response) => {
    try {
        const accessToken = req.cookies?.accessToken
        const refreshToken = req.cookies?.refreshToken

        let userId: string | null = null

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, secretKeyAccess) as { userId: string }
                userId = decoded.userId
            } catch (e) {
                // Access token прострочений, спробуємо по refresh
            }
        }

        if (!userId && refreshToken) {
            try {
                const decodedRefresh = jwt.verify(refreshToken, secretKeyRefresh) as { userId: string }
                userId = decodedRefresh.userId

                const newAccessToken = jwt.sign({ userId }, secretKeyAccess, { expiresIn: '1h' })
                res.cookie('accessToken', newAccessToken, { 
                    httpOnly: true, 
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'strict'
                })
            } catch (e) {
                res.clearCookie('accessToken')
                res.clearCookie('refreshToken')
                return res.status(401).json({ message: "Сесія завершилася" })
            }
        }

        if (!userId) {
            return res.status(401).json({ message: "Не авторизований" })
        }

        const user = await User.findById(userId).select('-password')
        if (!user) return res.status(404).json({ message: "Користувача не знайдено" })

        res.status(200).json(user)

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Помилка сервера" })
    }
})

// update user
router.put('/profile', async (req: Request, res: Response) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        let userId: string | null = null;

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, secretKeyAccess) as { userId: string };
                userId = decoded.userId;
            } catch (e) {
                // Токен прострочений, йдемо далі до Refresh
            }
        }

        if (!userId && refreshToken) {
            try {
                const decodedRefresh = jwt.verify(refreshToken, secretKeyRefresh) as { userId: string };
                userId = decodedRefresh.userId;

                const newAccessToken = jwt.sign({ userId }, secretKeyAccess, { expiresIn: '1h' });
                res.cookie('accessToken', newAccessToken, { 
                    httpOnly: true, 
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'strict',
                    secure: process.env.NODE_ENV === 'production'
                });
            } catch (e) {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(401).json({ message: "Сесія завершилася" });
            }
        }

        if (!userId) {
            return res.status(401).json({ message: "Не авторизований" });
        }

        const { name, email } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    name, 
                    email, 
                } 
            },
            { 
                returnDocument: 'after', // Замість new: true
                runValidators: true 
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        res.status(200).json(updatedUser);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Помилка сервера", error: error.message });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: "Вихід виконано" });
});

export default router