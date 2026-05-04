import { Router } from 'express'
import type { Request, Response } from 'express'
import User from '../models/User.js'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs';

const router = Router()

dotenv.config({ path: '.env.local' })

const secretKeyAccess = process.env.JWT_SECRET_ACCESS!
const secretKeyRefresh = process.env.JWT_SECRET_REFRESH!

router.post('/', async (req: Request, res: Response) => {
    try {
        const { password, ...userData } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const user = new User({
            ...userData,
            password: hashPassword
        });

        await user.save();
        res.status(201).json({ message: "User created" });
    } catch (error) {
        res.status(500).json(error)
        console.log(error)
    }
})

export default router