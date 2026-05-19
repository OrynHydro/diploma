import express, { type Request, type Response } from 'express';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.middleware.js'; 
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const router = express.Router();
dotenv.config({ path: '.env.local' });

const LIQPAY_PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY!;
const LIQPAY_PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY!;

router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { items, totalAmount, deliveryInfo, paymentMethod } = req.body; 

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Кошик порожній" });
        }

        if (
            !deliveryInfo || 
            !deliveryInfo.firstName || 
            !deliveryInfo.lastName || 
            !deliveryInfo.phone || 
            !deliveryInfo.city || 
            !deliveryInfo.postOffice ||
            !paymentMethod 
        ) {
            return res.status(400).json({ message: "Заповніть усі обов'язкові дані" });
        }

        const initialStatus = paymentMethod === 'Cash' ? 'Processing' : 'Pending';

        const newOrder = new Order({
            user: userId,
            items: items.map((item: any) => ({
                product: item.product,
                name: item.name,
                price: item.price,
                count: item.count,
                image: item.image
            })),
            totalAmount,
            deliveryInfo,
            paymentMethod,
            status: initialStatus
        });

        const savedOrder = await newOrder.save();

        if (paymentMethod === 'Cash') {
            return res.status(201).json({
                status: 'success',
                message: 'Замовлення успішно оформлено накладеним платежем',
                orderId: savedOrder._id
            });
        }

        const jsonParams = {
            public_key: LIQPAY_PUBLIC_KEY,
            version: 3,
            action: 'pay',
            amount: totalAmount,
            currency: 'USD', 
            description: `Оплата замовлення №${savedOrder._id} у TechStore`,
            order_id: savedOrder._id.toString(),
            
            server_url: `https://conceded-applied-unsettled.ngrok-free.dev/orders/webhook`,
            
            result_url: `${req.protocol}://${req.get('host')}/profile` 
        };

        const data = Buffer.from(JSON.stringify(jsonParams)).toString('base64');
        const signString = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
        const signature = crypto.createHash('sha1').update(signString).digest('base64');

        return res.status(201).json({
            status: 'liqpay_redirect',
            data,
            signature
        });

    } catch (error: any) {
        return res.status(500).json({ message: "Помилка сервера при створенні замовлення", error: error.message });
    }
});

router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const { data, signature } = req.body;

        if (!data || !signature) {
            return res.status(400).json({ message: "Відсутні платіжні дані" });
        }

        const signString = LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY;
        const localSignature = crypto.createHash('sha1').update(signString).digest('base64');

        if (signature !== localSignature) {
            console.error('🚨 Webhook Error: Невалідний підпис LiqPay!');
            return res.status(400).json({ message: "Невалідний підпис!" });
        }

        const paymentData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

        if (paymentData.status === 'success' || paymentData.status === 'sandbox') {
            const orderIdStr = paymentData.order_id;

            if (!mongoose.Types.ObjectId.isValid(orderIdStr)) {
                console.error(`🚨 Webhook Error: Невалідний формат order_id: ${orderIdStr}`);
                return res.status(400).send('Invalid Order ID format');
            }

            const updatedOrder = await Order.findByIdAndUpdate(
                new mongoose.Types.ObjectId(orderIdStr), 
                { status: 'Processing' },
                { new: true } 
            );

            if (!updatedOrder) {
                console.error(`🚨 Webhook Error: Замовлення з ID ${orderIdStr} не знайдено в базі!`);
                return res.status(404).send('Order not found');
            }
        }

        return res.status(200).send('OK');
    } catch (error: any) {
        console.error('КРИТИЧНА ПОМИЛКА ВЕБХУКА:', error);
        return res.status(500).json({ message: "Помилка сервера при обробці вебхука", error: error.message });
    }
});

router.get('/my-orders', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Неавторизований доступ" });
        }
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        return res.status(200).json(orders);
    } catch (error: any) {
        return res.status(500).json({ message: "Помилка сервера при отриманні замовлень" });
    }
});

export default router;