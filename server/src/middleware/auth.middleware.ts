import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

const secretKeyAccess = process.env.JWT_SECRET_ACCESS!;
const secretKeyRefresh = process.env.JWT_SECRET_REFRESH!;

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        let userId: string | null = null;

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, secretKeyAccess) as { userId: string };
                userId = decoded.userId;
            } catch (e) {
                console.log('Access token verification failed, trying refresh...');
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
                    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                    secure: process.env.NODE_ENV === 'production'
                });
            } catch (e) {
                console.log('Refresh token verification failed. Clearing cookies.');
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(401).json({ message: "Сесія завершилася, авторизуйтесь знову" });
            }
        }

        if (!userId) {
            return res.status(401).json({ message: "Не авторизований" });
        }

        req.userId = userId;
        return next();

    } catch (error) {
        console.error('Critical auth middleware error:', error);
        return res.status(500).json({ message: "Помилка авторизації" });
    }
};