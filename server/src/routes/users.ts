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
        const { password, ...userData } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const user = new User({
            ...userData,
            password: hashPassword
        });

        const dbUser = await user.save();

        const accessToken = jwt.sign({ userId: dbUser._id }, secretKeyAccess, {
			expiresIn: '1h',
		})
        const refreshToken = jwt.sign({ userId: dbUser._id }, secretKeyRefresh, {
            expiresIn: '14d',
        })

		res.cookie('accessToken', accessToken, {
			httpOnly: true,
			maxAge: 60 * 60 * 1000,
		})
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000,
        })

        
        res.status(201).json({ message: `User ${dbUser._id} created` });
    } catch (error: any) {
        res.status(500).json({ 
            message: "Сталася помилка на сервері", 
            error: error.message 
        });
    }
})

// login user
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone }) as IUserDocument | null; 
        if (!user) {
            return res.status(401).json({ message: "Invalid phone or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid phone or password" });
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
        const accessToken = req.cookies['accessToken'];
        const refreshToken = req.cookies['refreshToken'];

        let userId: string | null = null;

        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.SECRET_KEY_ACCESS as string) as { userId: string };
                userId = decoded.userId;
            } catch (e) {
                
            }
        }

        if (!userId && refreshToken) {
            try {
                const decodedRefresh = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH as string) as { userId: string };
                userId = decodedRefresh.userId;

                const newAccessToken = jwt.sign({ userId }, process.env.SECRET_KEY_ACCESS as string, { expiresIn: '1h' });
                
                res.cookie('accessToken', newAccessToken, { httpOnly: true, maxAge: 60 * 60 * 1000 });
            } catch (e) {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(403).json({ message: "Refresh token is invalid" });
            }
        }

        if (!userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const user = await User.findById(userId).select('-password'); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router