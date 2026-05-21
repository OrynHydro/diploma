import User  from '../models/User.js';
import express, { type Request, type Response } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { isAdmin } from '../middleware/isAdmin.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// upload image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Файл не завантажено" });
  
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// get admin stats
router.get('/stats', requireAuth, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        const sales = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            users: totalUsers,
            products: totalProducts,
            orders: totalOrders,
            sales: sales[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: "Помилка при отриманні статистики" });
    }
});

// update order status
router.put('/orders/:id/status', requireAuth, isAdmin, async (req, res) => {
    const { status } = req.body; 
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    res.json(order);
});

// get active orders
router.get('/orders', requireAuth, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'phone');

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: "Помилка при отриманні замовлень" });
    }
});

// create product
router.post('/products', requireAuth, isAdmin, async (req, res) => {
    try {
        const { name, brand, category, description, price, image, specs, discount, inStock } = req.body;

        const textToEmbed = `${brand} ${name} ${category} ${description} ${JSON.stringify(specs)}`;
        
        const vectorEmbedding = await generateEmbedding(textToEmbed);

        const newProduct = await Product.create({
            name, 
            brand, 
            category, 
            description, 
            price, 
            image, 
            specs, 
            discount,
            inStock: inStock ?? true,
            vectorEmbedding 
        });

        res.status(201).json({ message: "Товар успішно створено", product: newProduct });
    } catch (error) {
        console.error("Помилка при створенні товару:", error);
        res.status(500).json({ error: "Помилка при створенні товару з ембеддінгом" });
    }
});

// update product
router.put('/products/:id', requireAuth, isAdmin, async (req, res) => {
    try {
        const { price, discount, inStock, name, description } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: { price, discount, inStock, name, description } },
            { returnDocument: 'after' }
        );
        res.json(updatedProduct)
    } catch (e) {
        res.status(500).json({ message: "Помилка оновлення" })
    }
})

// delete product
router.delete('/products/:id', requireAuth, isAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Товар видалено" });
});

export default router;