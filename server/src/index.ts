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

import { MongoConnect } from './config/mongo-connect.js'

const app: Application = express()

const port = 5000

app.use(cors());
app.use(express.json())
app.use(cookieParser())

app.use('/users', usersRouter)
app.use('/products', productsRouter)
app.use('/chats', chatsRouter)
app.use('/sms', smsRouter)



MongoConnect()

app.listen(port, () => console.log(`Server is running on port ${port}`))
