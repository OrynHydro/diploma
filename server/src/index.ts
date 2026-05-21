import express from 'express'
import type { Application } from 'express'
import cors from 'cors'
import dns from "node:dns/promises";
import cookieParser from 'cookie-parser'

dns.setServers(["1.1.1.1"]);

import usersRouter from './routes/users.js'
import productsRouter from './routes/products.js'
import chatsRouter from './routes/chats.js'
import smsRouter from './routes/sms.js'
import reviewRouter from './routes/review.js'
import orderRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'

import { MongoConnect } from './config/mongo-connect.js'
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const app: Application = express()

const port = 5000

app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true 
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/users', usersRouter)
app.use('/products', productsRouter)
app.use('/chats', chatsRouter)
app.use('/sms', smsRouter)
app.use('/reviews', reviewRouter)
app.use('/orders', orderRouter)
app.use('/admin', adminRouter)


MongoConnect()

app.listen(port, () => console.log(`Server is running on port ${port}`))
