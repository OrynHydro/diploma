import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userRole?: 'user' | 'admin';
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
        let userRole: 'user' | 'admin' = 'user';

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, secretKeyAccess) as { userId: string, role: 'user' | 'admin' };
                userId = decoded.userId;
                userRole = decoded.role;
            } catch (e) {
                console.log('Access token verification failed, trying refresh...');
            }
        }

        if (!userId && refreshToken) {
            try {
                const decodedRefresh = jwt.verify(refreshToken, secretKeyRefresh) as { userId: string, role: 'user' | 'admin' };
                userId = decodedRefresh.userId;
                userRole = decodedRefresh.role;

                const newAccessToken = jwt.sign(
                    { userId, role: userRole }, 
                    secretKeyAccess, 
                    { expiresIn: '1h' }
                );
                
                res.cookie('accessToken', newAccessToken, { 
                    httpOnly: true, 
                    maxAge: 60 * 60 * 1000,
                    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                    secure: process.env.NODE_ENV === 'production'
                });
            } catch (e) {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(401).json({ message: "Сесія завершилася, авторизуйтесь знову" });
            }
        }

        if (!userId) {
            return res.status(401).json({ message: "Не авторизований" });
        }

        req.userId = userId;
        req.userRole = userRole;
        return next();

    } catch (error) {
        console.error('Critical auth middleware error:', error);
        return res.status(500).json({ message: "Помилка авторизації" });
    }
};