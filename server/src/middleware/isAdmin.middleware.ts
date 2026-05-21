import type { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Доступ заборонено: потрібні права адміністратора" });
    }
};