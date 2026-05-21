import type { Request, Response } from 'express'
import { Router } from 'express'
import twilio from 'twilio'
import { GenerateCode } from '../utils/otp.util.js'
import dotenv from 'dotenv'

const router = Router()

dotenv.config({ path: '.env.local' })

router.post('/', async (req: Request, res: Response) => {
    try {
        const { number } = req.body;
        
        if (!number) {
            return res.status(400).json({ error: "Номер телефону обов'язковий" });
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !phoneNumber) {
            throw new Error("TWILIO configuration is missing in environment variables");
        }

        const code = GenerateCode(6);

        const client = twilio(accountSid, authToken);

        await client.messages.create({
            body: `Ваш код для реєстрації: ${code}`,
            from: phoneNumber, 
            to: number,
        });

        console.log('SMS sent successfully');
        res.status(200).send({ message: "Код надіслано", code }); 
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).send('Error sending SMS');
    }
});

export default router
