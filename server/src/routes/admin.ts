import User  from '../models/User.js';
import express, { type Request, type Response } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { isAdmin } from '../middleware/isAdmin.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Файл не завантажено" });
  
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

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

router.put('/products/:id', requireAuth, isAdmin, async (req, res) => {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updated);
});

router.delete('/products/:id', requireAuth, isAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Товар видалено" });
});

router.put('/orders/:id/status', requireAuth, isAdmin, async (req, res) => {
    const { status } = req.body; 
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    res.json(order);
});

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

router.put('/orders/:id/status', requireAuth, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Замовлення не знайдено" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Помилка при оновленні статусу" });
    }
});


// create product
router.post('/', requireAuth, isAdmin, async (req, res) => {
    try {
        const { name, brand, category, description, price, image, specs, discount } = req.body;

        const textToEmbed = `${brand} ${name} ${category} ${description} ${JSON.stringify(specs)}`;
        const vectorEmbedding = await generateEmbedding(textToEmbed);

        const newProduct = await Product.create({
            name, brand, category, description, price, image, specs, discount,
            vectorEmbedding,
            inStock: true
        });

        res.status(201).json({ message: "Товар створено", product: newProduct });
    } catch (error) {
        res.status(500).json({ error: "Помилка при створенні" });
    }
});

// bulk create products
router.post('/products/bulk', requireAuth, isAdmin, async (req: Request, res: Response) => {
    try {
        const productsData = req.body; 

        if (!Array.isArray(productsData)) {
            return res.status(400).json({ error: "Очікується масив товарів" });
        }

        const productsToSave = await Promise.all(
            productsData.map(async (item) => {
                const { name, brand, category, description, price, image, specs, discount } = item;

                const textToEmbed = `
                    Товар: ${brand} ${name}
                    Категорія: ${category}
                    Опис: ${description}
                    Характеристики: ${JSON.stringify(specs)}
                `.trim();
                
                const vectorEmbedding = await generateEmbedding(textToEmbed);

                return {
                    name,
                    brand,
                    category,
                    description,
                    price,
                    image,
                    specs,
                    discount: discount || 0,
                    inStock: true, 
                    vectorEmbedding
                };
            })
        );

        const createdProducts = await Product.insertMany(productsToSave);

        res.status(201).json({ 
            message: `Успішно додано ${createdProducts.length} товарів з категоріями та зображеннями`, 
            count: createdProducts.length 
        });

    } catch (error) {
        console.error("Bulk create error:", error);
        res.status(500).json({ error: "Помилка при масовому створенні товарів" });
    }
});

router.delete('/products/:id', requireAuth, isAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Товар не знайдено" });
        }

        res.json({ message: "Товар успішно видалено" });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: "Помилка при видаленні товару" });
    }
});

router.put('/products/:id', requireAuth, isAdmin, async (req, res) => {
    try {
        const { price, discount, inStock, name, description } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: { price, discount, inStock, name, description } },
            { new: true }
        );
        res.json(updatedProduct)
    } catch (e) {
        res.status(500).json({ message: "Помилка оновлення" })
    }
})


export default router;